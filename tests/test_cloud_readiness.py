import hashlib
import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location('cloud_readiness', Path(__file__).parents[1] / 'src/processing/edition_manifest.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def test_manifest_rejects_processing_collapse():
    with pytest.raises(ValueError, match='Incomplete'):
        module.build_manifest('2026-10-24', 20, ['a'] * 4, b'body')


def test_small_actual_selection_is_not_filled_to_quota():
    manifest = module.build_manifest('2026-10-24', 4, ['a','b','c','d'], b'body')
    assert manifest['count'] == 4
    assert manifest['sha256'] == hashlib.sha256(b'body').hexdigest()


def test_manifest_tracks_omissions_and_is_public_allowlist():
    result = module.build_manifest('2026-10-24', 20, [str(i) for i in range(19)], b'body')
    assert result['omitted'] == 1
    assert set(result) == {'edition','count','selected','omitted','sha256','schema'}


@pytest.mark.parametrize('change', [{'edition':'2026-10-23'}, {'sha256':'0'*64}, {'count':4}, {'schema':99}])
def test_readiness_requires_today_exact_bytes_and_valid_manifest(change):
    record = module.build_manifest('2026-10-24', 20, [str(i) for i in range(19)], b'body')
    with pytest.raises(ValueError):
        module.validate_manifest({**record,**change},'2026-10-24', b'body')


def test_invalid_dates_duplicate_sources_and_empty_body_fail():
    for date, urls, body in [('2026-02-30',['a'],b'b'),('2026-10-24',['a','a'],b'b'),('2026-10-24',['a'],b'')]:
        with pytest.raises(ValueError):
            module.build_manifest(date,len(urls),urls,body)


def test_completion_written_only_after_all_posts_pass(tmp_path):
    posts = tmp_path / '_posts'
    posts.mkdir()
    (posts/'2026-10-24-summary-zh.md').write_bytes(b'Chinese body')
    editions={'zh':(2,['a','b']), 'en':(2,['a','b'])}
    with pytest.raises(FileNotFoundError):
        module.write_completion(tmp_path,'2026-10-24',editions)
    assert not (tmp_path/'editions/2026-10-24.json').exists()
    (posts/'2026-10-24-summary-en.md').write_bytes(b'English body')
    module.write_completion(tmp_path,'2026-10-24',editions)
    assert (tmp_path/'editions/2026-10-24.json').exists()


def test_old_post_cannot_be_certified_as_new_run(tmp_path):
    posts=tmp_path/'_posts'; posts.mkdir()
    (posts/'2026-10-24-summary-zh.md').write_bytes(b'old body')
    with pytest.raises(ValueError,match='rendered'):
        module.write_completion(tmp_path,'2026-10-24',{'zh':(1,['a'])}, {'zh':b'new body'})
    assert not (tmp_path/'editions/2026-10-24.json').exists()
