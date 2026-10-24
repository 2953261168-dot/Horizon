import importlib.util
from pathlib import Path
import subprocess

import pytest

spec=importlib.util.spec_from_file_location('cloud_state',Path(__file__).parents[1]/'scripts/cloud_state.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def git(path,*args):
    return subprocess.run(['git','-C',str(path),*args],check=True,capture_output=True,text=True).stdout.strip()


def test_stale_writer_cannot_overwrite_a_claim(tmp_path):
    remote=tmp_path/'remote'; remote.mkdir(); git(remote,'init','--bare')
    local=tmp_path/'local'; local.mkdir(); git(local,'init'); git(local,'remote','add','origin',str(remote))
    a=module.CloudState(local); b=module.CloudState(local)
    head_a,old_a=a.snapshot('2026-10-24')
    head_b,old_b=b.snapshot('2026-10-24')
    assert old_a is None and old_b is None
    a.commit('2026-10-24',head_a,{'phase':'preparing','attempts':1,'run_id':'1'})
    with pytest.raises(subprocess.CalledProcessError):
        b.commit('2026-10-24',head_b,{'phase':'preparing','attempts':1,'run_id':'2'})
    assert a.snapshot('2026-10-24')[1]['run_id']=='1'


def test_public_state_filters_secrets_and_requires_valid_phase(tmp_path):
    with pytest.raises(ValueError):
        module.public_record('2026-10-24',{'phase':'banana','attempts':1})
    record=module.public_record('2026-10-24',{'phase':'ready','attempts':2,'run_id':'7','password':'SECRET','recipient':'PRIVATE'})
    assert 'password' not in record and 'recipient' not in record
    assert record['edition']=='2026-10-24'
