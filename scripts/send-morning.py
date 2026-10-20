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


def main():
    address = os.environ.get('HORIZON_EMAIL_ADDRESS', '').strip()
    if not address or '@' not in address:
        raise ValueError('Missing or invalid HORIZON_EMAIL_ADDRESS secret')
    data = json.loads(Path('data/config.json').read_text(encoding='utf-8'))['email']
    data.update(email_address=address, recipients=[address])
    config = EmailConfig(**data)
    today = datetime.now(ZoneInfo('Asia/Shanghai')).strftime('%Y-%m-%d')
    post = subprocess.run(
        ['git', 'show', f'origin/gh-pages:_posts/{today}-summary-zh.md'],
        check=True, capture_output=True, encoding='utf-8',
    ).stdout
    if post.startswith('---\n'):
        post = post.split('---\n', 2)[-1].strip()
    if not post:
        raise RuntimeError('Today’s briefing is empty; refusing delivery')
    EmailManager(config).send_daily_summary(post, f'Horizon 早间简报 · {today}', config.resolve_recipients([]))


if __name__ == '__main__':
    main()
