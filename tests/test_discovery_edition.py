from datetime import datetime, timezone, timedelta
from src.models import ContentItem, SourceType
from src.processing.discovery import shortlist_candidates, save_coverage
from src.services.email_renderer import render_daily_letter
from bs4 import BeautifulSoup
import json

def make_item(i, profile, publisher):
 return ContentItem(id=f'rss:test:{i}',source_type=SourceType.RSS,title=f'News {i}',url=f'https://example.com/{i}',published_at=datetime.now(timezone.utc)-timedelta(minutes=i),profile=profile,metadata={'feed_name':publisher})

def test_shortlist_preserves_smaller_desks_and_publishers():
 items=[make_item(i,'tech-news','large') for i in range(90)]
 items += [make_item(100+i,'culture-news',f'culture-{i%3}') for i in range(10)]
 selected=shortlist_candidates(items,30)
 assert len(selected)==30
 assert len({i.id for i in selected})==30
 assert sum(i.profile=='culture-news' for i in selected)==10
 assert len({i.metadata['feed_name'] for i in selected})==4
 assert [i.id for i in selected]==[i.id for i in shortlist_candidates(items,30)]

def test_coverage_reports_distinct_stages(tmp_path):
 raw=[make_item(i,'life-news','publisher') for i in range(5)]
 path=tmp_path/'coverage.json';save_coverage(raw,raw[:4],raw[:2],None,path)
 data=json.loads(path.read_text(encoding='utf-8'))
 assert (data['fetched'],data['unique'],data['analysis_candidates'])==(5,4,2)

def test_letter_removes_unsafe_links_and_preserves_original_source():
 s='2026-10-21\n\n### [A headline](https://example.com/report) ⭐ 8/10\n\nA useful account.\n\n[bad](javascript:alert(1))\n\n**Background** Extra context.'
 rendered=render_daily_letter(s,'Daily','Horizon','Personal')
 soup=BeautifulSoup(rendered,'html.parser')
 assert soup.find('a',href='https://example.com/report')
 assert soup.find('a',href='https://2953261168-dot.github.io/Horizon/2026/10/21/summary-zh.html')
 assert not any(a.get('href','').startswith('javascript:') for a in soup.find_all('a'))
 assert '⭐' not in soup.get_text()
 assert 'A useful account.' in soup.get_text()
 assert 'Extra context.' in soup.get_text()

