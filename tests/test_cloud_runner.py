import importlib.util
from pathlib import Path
import pytest
import json
import sys

spec=importlib.util.spec_from_file_location('cloud_runner',Path(__file__).parents[1]/'scripts/cloud_runner.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_pages_needs_matching_successful_deployment():
    assert not module.pages_ready([{'name':'pages build and deployment','head_sha':'old','conclusion':'success'}],'new')
    assert not module.pages_ready([{'name':'pages build and deployment','head_sha':'new','conclusion':'failure'}],'new')
    assert module.pages_ready([{'name':'pages build and deployment','head_sha':'new','conclusion':'success'}],'new')


def test_ready_transition_requires_exact_published_manifest():
    manifest={'edition':'2026-10-24','languages':{'zh':{'sha256':'abc'}}}
    with pytest.raises(ValueError):
        module.verify_deployed(manifest,{'edition':'2026-10-23'})
    module.verify_deployed(manifest,manifest)


def test_lease_never_takes_over_another_active_run():
    with pytest.raises(RuntimeError,match='active'):
        module.claim_value({'phase':'preparing','attempts':1,'run_id':'1'},'2',True)
    assert module.claim_value({'phase':'failed','attempts':1,'run_id':'1'},'2',False)['attempts']==2
    with pytest.raises(RuntimeError,match='limit'):
        module.claim_value({'phase':'failed','attempts':3,'run_id':'1'},'2',False)


def test_uncertain_smtp_cannot_be_reclaimed():
    with pytest.raises(RuntimeError,match='uncertain'):
        module.claim_value({'phase':'sending','attempts':1,'run_id':'1'},'2',False)


def test_pinned_fetch_validates_full_sha_and_fetches_it_explicitly(monkeypatch):
    calls=[]
    monkeypatch.setattr(module,'command',lambda *args:calls.append(args))
    module.fetch_publication('a'*40)
    assert ('git','fetch','origin','a'*40,'--depth=1') in calls
    with pytest.raises(ValueError): module.fetch_publication('--bad-ref')


@pytest.mark.parametrize('receipt',[None,{'status':'sent'}])
@pytest.mark.parametrize('cloud_record',[None,{'phase':'failed','attempts':1,'run_id':'previous'}])
def test_actual_dry_run_entry_point_does_not_publish_or_send(monkeypatch,tmp_path,receipt,cloud_record):
    today=module.datetime.now(module.ZoneInfo('Asia/Shanghai')).strftime('%Y-%m-%d')
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv('GITHUB_REPOSITORY',module.RUNNER)
    monkeypatch.setenv('GITHUB_RUN_ID','10')
    monkeypatch.setattr(sys,'argv',['cloud_runner.py','--edition',today,'--mode','dry-run'])
    class Mail:
        def __init__(self,*args): pass
        def read(self,*args): return receipt
    class State:
        def __init__(self,*args): pass
        def snapshot(self,*args): return None,cloud_record
        def commit(self,*args): pytest.fail('Dry-run must never mutate public state')
    monkeypatch.setattr(module,'GitDeliveryState',Mail)
    monkeypatch.setattr(module,'CloudState',State)
    (tmp_path/'data').mkdir()
    (tmp_path/'data/config.json').write_text(json.dumps({'email':{'enabled':True}}))
    calls=[]
    def command(*args):
        calls.append(args)
        if args==('uv','run','horizon','--hours','24'):
            docs=tmp_path/'docs'; (docs/'_posts').mkdir(parents=True)
            (docs/'_posts'/f'{today}-summary-zh.md').write_bytes(b'fresh post')
            from src.processing.edition_manifest import write_completion
            write_completion(docs,today,{'zh':(1,['https://example.org'])})
    monkeypatch.setattr(module,'command',command)
    module.main()
    assert ('uv','run','horizon','--hours','24') in calls
    assert all('push' not in call and 'scripts/send-morning.py' not in call for call in calls)
    assert json.loads((tmp_path/'data/config.json').read_text())['email']['enabled'] is False
