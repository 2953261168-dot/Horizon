"""Diverse, deterministic discovery shortlist and honest stage-level reporting."""
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit
import json

def shortlist_candidates(items, limit):
    if not limit or len(items)<=limit:return list(items)
    groups=defaultdict(lambda:defaultdict(list))
    for item in items:
        profile=item.profile if isinstance(item.profile,str) else 'unrouted'
        domain=urlsplit(str(item.url)).hostname or 'unknown'
        # Google redirects share a host; use the original publisher when supplied.
        publisher=item.metadata.get('source_name') or item.metadata.get('feed_name') or domain
        groups[profile][publisher].append(item)
    queues={}
    for profile,publishers in sorted(groups.items()):
        sources=[deque(sorted(values,key=lambda i:(i.published_at,i.id),reverse=True)) for _,values in sorted(publishers.items())]
        ordered=[]
        while sources:
            for source in sources:ordered.append(source.popleft())
            sources=[q for q in sources if q]
        queues[profile]=deque(ordered)
    result=[]
    while queues and len(result)<limit:
        for key in list(queues):
            if len(result)>=limit:break
            result.append(queues[key].popleft())
            if not queues[key]:del queues[key]
    return result

def save_coverage(raw, unique, candidates, report, path='docs/_data/coverage.json'):
    counts=defaultdict(int)
    for item in raw:counts[str(item.profile)]+=1
    outcomes=getattr(report,'outcomes',[]) if report else []
    data={'generated_at':datetime.now(timezone.utc).isoformat(),'fetched':len(raw),'unique':len(unique),'analysis_candidates':len(candidates),'by_profile':dict(counts),'collection_window_hours':24,'sources_attempted':len(outcomes),'note':'采集数含跨源重复；去重后按主题和出版方均衡抽取候选，再作深度分析。'}
    p=Path(path);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
