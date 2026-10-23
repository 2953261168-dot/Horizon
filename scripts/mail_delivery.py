"""Durable per-edition delivery guard, isolated from the public Pages branch."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess


class GitDeliveryState:
    branch='horizon-mail-state'

    def __init__(self,repo):
        self.repo=Path(repo)

    def _git(self,*args,input=None):
        env=os.environ.copy()
        env.update(GIT_AUTHOR_NAME='Horizon delivery',GIT_AUTHOR_EMAIL='horizon-delivery@users.noreply.github.com',GIT_COMMITTER_NAME='Horizon delivery',GIT_COMMITTER_EMAIL='horizon-delivery@users.noreply.github.com')
        # Binary stdin preserves LF tree records on Windows as well as Linux.
        payload=input.encode('utf-8') if input is not None else None
        return subprocess.run(['git','-C',str(self.repo),*args],input=payload,capture_output=True,check=True,env=env).stdout.decode('utf-8').strip()

    def _refresh(self):
        ref='refs/heads/'+self.branch
        remote=self._git('ls-remote','--heads','origin',ref)
        if not remote:return None
        self._git('fetch','origin',ref+':refs/remotes/origin/'+self.branch)
        return self._git('rev-parse','refs/remotes/origin/'+self.branch)

    @staticmethod
    def _filename(date):
        parsed=datetime.strptime(date,'%Y-%m-%d')
        if parsed.strftime('%Y-%m-%d')!=date:raise ValueError('Invalid edition date')
        return date+'.json'

    def _read_at(self,head,name):
        if not head:return None
        if not self._git('ls-tree','--name-only',head,'--',name):return None
        return json.loads(self._git('show',head+':'+name))

    def read(self,date):
        return self._read_at(self._refresh(),self._filename(date))

    def write(self,date,value):
        name=self._filename(date);head=self._refresh()
        existing=self._read_at(head,name)
        if value.get('status')=='sending' and existing:
            raise RuntimeError('An edition delivery claim already exists; refusing another sender')
        record={**value,'edition':date,'updated_at':datetime.now(timezone.utc).isoformat()}
        blob=self._git('hash-object','-w','--stdin',input=json.dumps(record,sort_keys=True)+'\n')
        entries=self._git('ls-tree',head).splitlines() if head else []
        entries=[entry for entry in entries if entry.split('\t',1)[-1]!=name]
        entries.append('100644 blob '+blob+'\t'+name)
        tree=self._git('mktree',input='\n'.join(entries)+'\n')
        parents=['-p',head] if head else []
        commit=self._git('commit-tree',tree,*parents,'-m','Record delivery '+date+' '+record['status'])
        # Fast-forward only. A racing or rewritten branch fails before another SMTP attempt.
        self._git('push','origin',commit+':refs/heads/'+self.branch)


def guarded_delivery(date,state,send):
    record=state.read(date)
    if record:
        if record.get('status')=='sent':return 'already-sent'
        raise RuntimeError('Previous delivery is uncertain; inspect its SMTP log before retrying')
    state.write(date,{'status':'sending'})
    # Do not erase the claim on SMTP errors: a lost response may follow accepted DATA.
    send()
    state.write(date,{'status':'sent'})
    return 'sent'
