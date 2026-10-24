import asyncio
import json
from types import SimpleNamespace

import pytest

from src.ai.enricher import ContentEnricher
from tests.test_enricher import PROFILES, FakeTools, make_item


def test_optional_block_failure_keeps_valid_primary_story():
    async def complete(**request):
        if '# Block contract' not in request['system']:
            return json.dumps({'tool_requests': [{'block_id': 'background', 'tool': 'web_search', 'arguments': {'query': 'project architecture'}, 'purpose': 'Context'}]})
        if 'Generate only these blocks:' in request['system']:
            return json.dumps({'title': 'Release', 'blocks': [
                {'id': 'summary', 'title': 'Summary', 'content': 'A new architecture was released.'}
            ]})
        return 'not valid JSON'

    item = make_item()
    item.processing.classification.profile = 'finance-news'
    item.profile = 'finance-news'
    enricher = ContentEnricher(SimpleNamespace(complete=complete), PROFILES, ['en'], tools=FakeTools())
    asyncio.run(enricher._enrich_item(item))
    assert item.processing.artifacts['en'].blocks[0].content == 'A new architecture was released.'
    assert [b.id for b in item.processing.artifacts['en'].blocks] == ['summary']


def test_second_language_failure_preserves_completed_first_language():
    async def complete(**request):
        return '{"tool_requests": []}'

    item = make_item()
    item.processing.classification.profile = 'finance-news'
    item.profile = 'finance-news'
    enricher = ContentEnricher(SimpleNamespace(complete=complete), PROFILES, ['zh', 'en'])
    from src.ai.enricher import GeneratedArtifact
    from src.models import ContentBlock

    async def generate(item, profile, language, results):
        if language == 'en':
            raise ValueError('English output invalid')
        return GeneratedArtifact(title='新架构发布', blocks=[
            ContentBlock(id='summary', title='摘要', content='项目发布了新架构。', primary=True)
        ])

    enricher._generate_artifact = generate
    with pytest.raises(ValueError, match='English output invalid'):
        asyncio.run(enricher._enrich_item(item))
    assert item.processing.artifacts['zh'].title == '新架构发布'
    assert 'en' not in item.processing.artifacts


def test_primary_generation_does_not_request_unavailable_optional_context():
    async def complete(**request):
        if '# Block contract' not in request['system']:
            return '{"tool_requests": []}'
        if '`background` optional' in request['system']:
            return 'not valid JSON'
        return json.dumps({'title': 'Release', 'blocks': [
            {'id': 'summary', 'title': 'Summary', 'content': 'A new architecture was released.'}
        ]})

    item = make_item()
    item.profile = item.processing.classification.profile = 'finance-news'
    enricher = ContentEnricher(SimpleNamespace(complete=complete), PROFILES, ['en'])
    asyncio.run(enricher._enrich_item(item))
    assert item.processing.artifacts['en'].blocks[0].primary


def test_partial_edition_is_rejected_before_publication():
    from src.processing.source_evidence import validate_edition_size
    with pytest.raises(RuntimeError, match='4/20'):
        validate_edition_size(4, 20, 'zh')
    validate_edition_size(20, 20, 'zh')
    validate_edition_size(4, 4, 'zh')


def test_invalid_optional_citation_does_not_discard_primary():
    async def complete(**request):
        if '# Block contract' not in request['system']:
            return json.dumps({'tool_requests': [{'block_id': 'background', 'tool': 'web_search', 'arguments': {'query': 'project architecture'}, 'purpose': 'Context'}]})
        if 'Generate only these blocks:' in request['system']:
            return json.dumps({'title': 'Release', 'blocks': [
                {'id': 'summary', 'title': 'Summary', 'content': 'A new architecture was released.'}
            ]})
        return json.dumps({'block': {'id': 'background', 'title': 'Context', 'content': 'Unverified context.', 'source_refs': ['tool-99-1']}})

    item = make_item()
    item.profile = item.processing.classification.profile = 'finance-news'
    enricher = ContentEnricher(SimpleNamespace(complete=complete), PROFILES, ['en'], tools=FakeTools())
    asyncio.run(enricher._enrich_item(item))
    assert [block.id for block in item.processing.artifacts['en'].blocks] == ['summary']
