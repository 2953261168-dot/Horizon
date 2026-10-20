import runpy
from pathlib import Path
from types import SimpleNamespace
import pytest


def load_script(monkeypatch):
    script = Path(__file__).parents[1] / 'scripts/send-morning.py'
    monkeypatch.setenv('HORIZON_EMAIL_ADDRESS', 'reader@example.com')
    monkeypatch.chdir(script.parents[1])
    return runpy.run_path(str(script))


def test_connection_test_does_not_require_prepared_post(monkeypatch):
    script = load_script(monkeypatch)
    sent = []
    monkeypatch.setenv('HORIZON_EMAIL_TEST', '1')
    monkeypatch.setattr('src.services.email.EmailManager.send_daily_summary', lambda self, *args: sent.append(args))
    monkeypatch.setattr('subprocess.run', lambda *a, **k: pytest.fail('Test mode must not read a post'))
    script['main']()
    assert sent[0][2] == ['reader@example.com']
    assert '邮件测试' in sent[0][1]


def test_daily_delivery_reads_chinese_post_and_strips_frontmatter(monkeypatch):
    script = load_script(monkeypatch)
    monkeypatch.delenv('HORIZON_EMAIL_TEST', raising=False)
    sent = []
    def read_post(args, **kwargs):
        assert args[-1].endswith('-summary-zh.md')
        return SimpleNamespace(stdout='---\nlang: zh\n---\n\n# 今日简报\n新闻正文')
    monkeypatch.setattr('subprocess.run', read_post)
    monkeypatch.setattr('src.services.email.EmailManager.send_daily_summary', lambda self, *args: sent.append(args))
    script['main']()
    assert sent[0][0].startswith('# 今日简报')
    assert 'lang: zh' not in sent[0][0]


def test_missing_secret_fails_before_delivery(monkeypatch):
    script = load_script(monkeypatch)
    monkeypatch.delenv('HORIZON_EMAIL_ADDRESS')
    with pytest.raises(ValueError, match='HORIZON_EMAIL_ADDRESS'):
        script['main']()
