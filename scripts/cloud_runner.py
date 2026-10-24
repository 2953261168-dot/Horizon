"""Independent runner: publish only completed editions; preserve durable SMTP guard."""
import argparse
from datetime import datetime
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import time
from zoneinfo import ZoneInfo
from urllib.request import Request, urlopen

sys.path[:0]=[str(Path(__file__).resolve().parent),str(Path(__file__).resolve().parents[1])]
from cloud_state import CloudState
from mail_delivery import GitDeliveryState
from src.processing.edition_manifest import validate_manifest

REPOSITORY='2953261168-dot/Horizon'
RUNNER='2953261168-dot/horizon-runner'
SITE='https://2953261168-dot.github.io/Horizon'


def pages_ready(runs, sha):
    return any(r.get('name')=='pages build and deployment' and r.get('head_sha')==sha
               and r.get('conclusion')=='success' for r in runs)


def verify_deployed(expected, actual):
    if expected != actual:
        raise ValueError('Public edition manifest does not match published content')


def claim_value(record, run_id, active):
    if record and record.get('phase') in {'sending','sent'}:
        raise RuntimeError('SMTP result uncertain; manual verification required')
    if active:
        raise RuntimeError('Previous generation run is still active')
    attempts=(record or {}).get('attempts',0)
    if type(attempts) is not int or attempts >= 3:
        raise RuntimeError('Preparation attempt limit reached')
    return {'phase':'preparing','attempts':attempts+1,'run_id':run_id}


def api(path):
    token=os.environ.get('GITHUB_TOKEN','')
    request=Request('https://api.github.com/repos/'+path,headers={
        'Authorization':'Bearer '+token,'User-Agent':'horizon-runner',
        'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'})
    with urlopen(request,timeout=20) as response:
        return json.load(response)


def read_url(url):
    with urlopen(Request(url,headers={'Cache-Control':'no-cache'}),timeout=20) as response:
        return json.load(response)


def command(*args):
    subprocess.run(args,check=True)


def fetch_publication(sha):
    if not isinstance(sha,str) or not re.fullmatch('[0-9a-f]{40}',sha):
        raise ValueError('Invalid publication SHA')
    command('git','fetch','origin',sha,'--depth=1')
    command('git','cat-file','-e',sha+'^{commit}')


def manifest_for(edition, read_post):
    manifest=json.loads(read_post('editions/'+edition+'.json'))
    if manifest.get('edition')!=edition or not manifest.get('languages'):
        raise ValueError('Missing edition completion')
    for lang,record in manifest['languages'].items():
        if lang not in {'zh','en'}:
            raise ValueError('Unsupported language')
        validate_manifest(record,edition,read_post(f'_posts/{edition}-summary-{lang}.md'))
    if 'zh' not in manifest['languages']:
        raise ValueError('Missing Chinese edition')
    return manifest


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--edition',required=True)
    parser.add_argument('--mode',choices=['dry-run','live'],default='dry-run')
    args=parser.parse_args()
    now=datetime.now(ZoneInfo('Asia/Shanghai'))
    if args.edition != now.strftime('%Y-%m-%d'):
        raise ValueError('Refusing a different edition date')
    if os.environ.get('GITHUB_REPOSITORY') != RUNNER:
        raise RuntimeError('This entry point requires the independent runner repository')
    root=Path.cwd()
    mail=GitDeliveryState(root)
    delivery=mail.read(args.edition)
    already_sent=bool(delivery and delivery.get('status')=='sent')
    if delivery and not already_sent:
        raise RuntimeError('Existing SMTP delivery is uncertain')
    if args.mode=='live' and os.environ.get('HORIZON_PRODUCTION_ENABLED')!='true':
        raise RuntimeError('Production cutover is not enabled')
    state=CloudState(root)
    head,record=state.snapshot(args.edition)
    if already_sent and not (record or {}).get('published_sha'):
        print('Existing sent receipt predates cloud migration; no SMTP or fabricated monitor success')
        return
    run_id=os.environ['GITHUB_RUN_ID']
    ready=record and (record.get('phase')=='ready' or already_sent)
    if ready:
        sha=record['published_sha']
        fetch_publication(sha)
        manifest=manifest_for(args.edition,lambda path:subprocess.run(
            ['git','show',sha+':'+path],capture_output=True,check=True).stdout)
    else:
        active=False
        if record and record.get('phase') in {'preparing','publishing'}:
            previous=api(RUNNER+'/actions/runs/'+str(record['run_id']))
            active=previous.get('status')!='completed'
        value=claim_value(record,run_id,active)
        if args.mode=='live':
            head=state.commit(args.edition,head,value)
        # Isolated job configuration; never enable generation-time SMTP or webhooks.
        path=Path('data/config.json'); config=json.loads(path.read_text(encoding='utf-8'))
        config['email']['enabled']=False
        for key in ['webhook','wechat']:
            if isinstance(config.get(key),dict): config[key]['enabled']=False
        path.write_text(json.dumps(config,ensure_ascii=False),encoding='utf-8')
        os.environ['HORIZON_CLOUD_COMPLETION']='1'
        try:
            command('bash','scripts/restore-history.sh')
            # Previous files cannot satisfy this run's completion.
            completion=Path('docs/editions')/(args.edition+'.json')
            if completion.exists(): completion.unlink()
            command('uv','run','horizon','--hours','24')
            manifest=manifest_for(args.edition,lambda path:(Path('docs')/path).read_bytes())
            if args.mode=='dry-run':
                print('Dry-run content verified; no publication, state mutation or email')
                return
            value.update(phase='publishing',count=manifest['languages']['zh']['count'])
            head=state.commit(args.edition,head,value)
            # Separate temporary checkout preserves source origin and credentials for mail state.
            command('git','config','user.name','Horizon runner')
            command('git','config','user.email','horizon-runner@users.noreply.github.com')
            command('git','add','-f','docs')
            tree=subprocess.run(['git','write-tree','--prefix=docs/'],capture_output=True,text=True,check=True).stdout.strip()
            parent=subprocess.run(['git','rev-parse','origin/gh-pages'],capture_output=True,text=True,check=True).stdout.strip()
            sha=subprocess.run(['git','commit-tree',tree,'-p',parent,'-m','Publish '+args.edition],capture_output=True,text=True,check=True).stdout.strip()
            command('git','push','origin',sha+':refs/heads/gh-pages')
        except Exception:
            if args.mode=='live':
                value['phase']='failed'
                state.commit(args.edition,head,value)
            raise
    # A matching completed deployment AND its actual served manifest are required.
    deployed=False
    for _ in range(60):
        runs=api(REPOSITORY+'/actions/runs?head_sha='+sha+'&per_page=100')['workflow_runs']
        if pages_ready(runs,sha):
            verify_deployed(manifest,read_url(SITE+'/editions/'+args.edition+'.json?run='+run_id))
            deployed=True
            break
        time.sleep(10)
    if not deployed:
        raise RuntimeError('Pages deployment not verified within ten minutes')
    if args.mode=='dry-run':
        print('Existing ready edition verified; dry-run skips email')
        return
    value={**(record or {}),'phase':'ready','attempts':(record or value)['attempts'],
           'run_id':run_id,'published_sha':sha,'count':manifest['languages']['zh']['count'],
           'sha256':manifest['languages']['zh']['sha256']}
    head=state.commit(args.edition,head,value)
    if datetime.now(ZoneInfo('Asia/Shanghai')).hour<8:
        print('Ready; waiting for morning dispatch')
        return
    if not already_sent:
        value['phase']='sending'
        head=state.commit(args.edition,head,value)
        os.environ['HORIZON_VERIFIED_COMMIT']=sha
        command('uv','run','python','scripts/send-morning.py')
    if (mail.read(args.edition) or {}).get('status')!='sent':
        raise RuntimeError('Sender did not produce a sent receipt')
    ping=os.environ.get('HEALTHCHECKS_PING_URL','')
    if ping:
        # URL is a secret, never include it or remote errors in logs.
        try:
            with urlopen(Request(ping,method='POST'),timeout=20) as response:
                if response.status!=200: raise RuntimeError('monitor_ping_failed')
        except Exception:
            raise RuntimeError('Delivery succeeded but monitor ping failed') from None
    else:
        raise RuntimeError('Delivery succeeded but monitor secret is missing')
    value['phase']='sent'
    state.commit(args.edition,head,value)


if __name__=='__main__':
    main()
