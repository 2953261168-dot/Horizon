"""Public edition state with fast-forward compare-and-swap updates."""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0,str(Path(__file__).resolve().parent))
from mail_delivery import GitDeliveryState


def public_record(edition, value):
    GitDeliveryState._filename(edition)
    if value.get('phase') not in {'preparing','publishing','ready','sending','sent','failed'}:
        raise ValueError('Invalid cloud phase')
    if type(value.get('attempts')) is not int or not 0 <= value['attempts'] <= 3:
        raise ValueError('Invalid attempt count')
    allowed={'phase','attempts','run_id','count','sha256','published_sha'}
    result={key:value[key] for key in allowed if key in value}
    return {**result,'edition':edition,'updated_at':datetime.now(timezone.utc).isoformat()}


class CloudState(GitDeliveryState):
    branch='horizon-cloud-state'

    def snapshot(self, edition):
        head=self._refresh()
        return head,self._read_at(head,self._filename(edition))

    def commit(self, edition, expected_head, value):
        # No refreshing here: build directly on the caller's snapshot. A race rejects push.
        record=public_record(edition,value)
        name=self._filename(edition)
        blob=self._git('hash-object','-w','--stdin',input=json.dumps(record,sort_keys=True)+'\n')
        entries=self._git('ls-tree',expected_head).splitlines() if expected_head else []
        entries=[line for line in entries if line.split('\t',1)[-1]!=name]
        entries.append('100644 blob '+blob+'\t'+name)
        tree=self._git('mktree',input='\n'.join(entries)+'\n')
        parents=['-p',expected_head] if expected_head else []
        commit=self._git('commit-tree',tree,*parents,'-m','Edition '+edition+' '+record['phase'])
        self._git('push','origin',commit+':refs/heads/'+self.branch)
        return commit
