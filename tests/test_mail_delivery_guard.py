import importlib.util
from pathlib import Path
import subprocess
import sys

import pytest

SCRIPTS=Path(__file__).resolve().parents[1]/'scripts'
sys.path.insert(0,str(SCRIPTS))
from mail_delivery import GitDeliveryState, guarded_delivery


def git(root,*args):
    return subprocess.run(['git','-C',str(root),*args],check=True,capture_output=True,text=True).stdout.strip()


@pytest.fixture
def state(tmp_path):
    remote=tmp_path/'remote.git';remote.mkdir();git(remote,'init','--bare')
    checkout=tmp_path/'checkout';checkout.mkdir();git(checkout,'init')
    git(checkout,'remote','add','origin',str(remote))
    git(checkout,'config','user.name','Delivery test');git(checkout,'config','user.email','delivery@example.invalid')
    return GitDeliveryState(checkout)


def test_successful_delivery_is_persisted_and_not_repeated(state):
    calls=[]
    assert guarded_delivery('2026-10-23',state,lambda:calls.append('sent'))=='sent'
    # A fresh instance simulates a separate scheduled workflow runner.
    fresh=GitDeliveryState(state.repo)
    assert guarded_delivery('2026-10-23',fresh,lambda:calls.append('duplicate'))=='already-sent'
    assert calls==['sent']
    assert fresh.read('2026-10-23')['status']=='sent'


def test_uncertain_smtp_result_blocks_automatic_resend(state):
    def uncertain():raise TimeoutError('SMTP connection lost after DATA')
    with pytest.raises(TimeoutError):guarded_delivery('2026-10-23',state,uncertain)
    assert GitDeliveryState(state.repo).read('2026-10-23')['status']=='sending'
    with pytest.raises(RuntimeError,match='uncertain'):
        guarded_delivery('2026-10-23',GitDeliveryState(state.repo),lambda:pytest.fail('must not resend'))


def test_state_is_independent_for_each_edition(state):
    calls=[]
    for date in ('2026-10-23','2026-10-24'):
        assert guarded_delivery(date,state,lambda:calls.append(date))=='sent'
    fresh=GitDeliveryState(state.repo)
    assert all(fresh.read(date)['status']=='sent' for date in calls)


def test_marker_failure_stops_before_smtp():
    class BrokenState:
        def read(self,date):return None
        def write(self,date,value):raise RuntimeError('state branch is unavailable')
    with pytest.raises(RuntimeError):
        guarded_delivery('2026-10-23',BrokenState(),lambda:pytest.fail('no durable claim'))


def test_unrecognised_state_fails_closed(state):
    state.write('2026-10-23',{'status':'unexpected'})
    with pytest.raises(RuntimeError):guarded_delivery('2026-10-23',state,lambda:pytest.fail('unknown state'))
