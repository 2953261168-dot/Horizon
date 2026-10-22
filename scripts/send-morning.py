"""Send today's prepared briefing; never silently mail yesterday's news."""
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.models import EmailConfig
from src.services.email import EmailManager


def edition_date(today, sample):
    if not sample:
        return today, False
    parsed = datetime.strptime(sample, '%Y-%m-%d')
    if parsed.strftime('%Y-%m-%d') != sample:
        raise ValueError('Sample date must use YYYY-MM-DD')
    return sample, True


def main():
    address = os.environ.get('HORIZON_EMAIL_ADDRESS', '').strip()
    if not address or '@' not in address:
        raise ValueError('Missing or invalid HORIZON_EMAIL_ADDRESS secret')
    data = json.loads(Path('data/config.json').read_text(encoding='utf-8'))['email']
    data.update(email_address=address, recipients=[address])
    config = EmailConfig(**data)
    today = datetime.now(ZoneInfo('Asia/Shanghai')).strftime('%Y-%m-%d')
    selected, is_sample = edition_date(today, os.environ.get('HORIZON_TEST_EDITION', '').strip())
    post = subprocess.run(
        ['git', 'show', f'origin/gh-pages:_posts/{selected}-summary-zh.md'],
        check=True, capture_output=True, encoding='utf-8',
    ).stdout
    if post.startswith('---\n'):
        post = post.split('---\n', 2)[-1].strip()
    if not post:
        raise RuntimeError('Today’s briefing is empty; refusing delivery')
    subject = f'Horizon 样刊测试 · {selected}（非今日晨报）' if is_sample else f'Horizon 早间简报 · {today}'
    if is_sample:
        post = f'> 样刊视觉测试：原刊日期 {selected}；发送日期 {today}（北京时间）。这不是今日晨报。\n\n' + post
    EmailManager(config).send_daily_summary(post, subject, config.resolve_recipients([]))
    print('SMTP delivery completed: ' + ('explicit sample ' + selected if is_sample else today))


if __name__ == '__main__':
    main()

