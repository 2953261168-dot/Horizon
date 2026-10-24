"""Public completion manifest; never infer readiness from file existence."""
import hashlib
import math
import json
from pathlib import Path
from datetime import date


def _date(value):
    if date.fromisoformat(value).isoformat() != value:
        raise ValueError('Invalid edition date')


def build_manifest(edition, selected, story_urls, post):
    _date(edition)
    count = len(story_urls)
    if type(selected) is not int or selected < 1 or count > selected:
        raise ValueError('Invalid selected count')
    minimum = math.ceil(selected * .9)
    if count < minimum:
        raise ValueError(f'Incomplete edition: {count}/{selected}')
    if len(set(story_urls)) != count or any(not url for url in story_urls):
        raise ValueError('Duplicate or empty story source')
    if not post.strip():
        raise ValueError('Empty edition')
    return {'schema':1, 'edition':edition,'count':count,'selected':selected,
            'omitted':selected-count,'sha256':hashlib.sha256(post).hexdigest()}


def validate_manifest(record, edition, post):
    _date(edition)
    if record.get('schema') != 1 or record.get('edition') != edition:
        raise ValueError('Wrong edition or manifest schema')
    count, selected = record.get('count'), record.get('selected')
    if type(count) is not int or type(selected) is not int or selected < 1:
        raise ValueError('Invalid counts')
    if not math.ceil(selected*.9) <= count <= selected or record.get('omitted') != selected-count:
        raise ValueError('Incomplete edition')
    if not post.strip() or record.get('sha256') != hashlib.sha256(post).hexdigest():
        raise ValueError('Edition content hash mismatch')
    return record


def write_completion(docs, edition, languages, expected_posts=None):
    docs = Path(docs)
    if not languages or any(lang not in {'zh','en'} for lang in languages):
        raise ValueError('Missing or unsupported completion language')
    records = {}
    for lang, (selected, urls) in languages.items():
        body = (docs / '_posts' / f'{edition}-summary-{lang}.md').read_bytes()
        if expected_posts is not None and body != expected_posts.get(lang):
            raise ValueError('Post does not match this run rendered content')
        records[lang] = build_manifest(edition,selected,urls,body)
    destination = docs / 'editions' / f'{edition}.json'
    destination.parent.mkdir(parents=True,exist_ok=True)
    temporary = destination.with_suffix('.tmp')
    temporary.write_text(json.dumps({'edition':edition,'languages':records},sort_keys=True)+'\n',encoding='utf-8')
    temporary.replace(destination)
    return records
