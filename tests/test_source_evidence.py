import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

from src.models import ContentItem, SourceType
from src.processing.source_evidence import eligible_discovery_item, prepare_source_evidence, has_localized_artifact


def item(url="https://example.org/report", content="A short feed headline.", title="A useful story"):
    return ContentItem(id="rss:evidence:1", source_type=SourceType.RSS, title=title, url=url, content=content, published_at=datetime.now(timezone.utc))


def test_redirect_headline_and_coupon_are_not_primary_reporting():
    assert not eligible_discovery_item(item(url="https://news.google.com/rss/articles/opaque"))
    assert not eligible_discovery_item(item(title="Coupon codes: 20% off"))
    assert eligible_discovery_item(item(title="A film review and its cultural context"))


def test_full_article_replaces_thin_feed_and_keeps_supplied_comments():
    source = item(content="A teaser.\n\n--- Top Comments ---\n[reader]: supplied comment")
    async def extract(*args):
        return "Specific source reporting. " * 20
    result = asyncio.run(prepare_source_evidence([source], None, SimpleNamespace(extract=extract)))
    assert result[0].metadata["evidence_mode"] == "article_text"
    assert "supplied comment" in result[0].content
    assert "A teaser" not in result[0].content


def test_missing_article_cannot_turn_a_headline_into_a_report():
    async def extract(*args):
        return None
    assert asyncio.run(prepare_source_evidence([item()], None, SimpleNamespace(extract=extract))) == []


def test_substantial_feed_excerpt_is_labelled_as_an_excerpt():
    async def extract(*args):
        return None
    result = asyncio.run(prepare_source_evidence([item(content="A supplied, substantive excerpt. " * 20)], None, SimpleNamespace(extract=extract)))
    assert result[0].metadata["evidence_mode"] == "feed_excerpt"


def test_missing_localization_never_becomes_an_english_fallback_in_chinese():
    assert not has_localized_artifact(item(), "zh")


def test_reddit_text_post_is_attributed_without_article_fetch():
    source = item(url='https://www.reddit.com/r/popculturechat/comments/abc123/a_post/', content='<div class="md"><p>I asked my calendar for space. It booked another meeting.</p></div> submitted by <a>u/person</a> [comments]')
    async def extract(*args):
        raise AssertionError('A platform post is not an article')
    result = asyncio.run(prepare_source_evidence([source], None, SimpleNamespace(extract=extract)))
    assert len(result) == 1
    assert result[0].content == 'Platform discussion / user-created text; claims not independently verified.\nI asked my calendar for space. It booked another meeting.'
    assert result[0].metadata['evidence_mode'] == 'platform_text'


def test_reddit_media_and_unsupported_placeholder_are_not_read_text():
    async def extract(*args):
        return None
    for content in ['<img alt="A spectacular event"><span>submitted by u/person [link] [comments]</span>', '<div class="md">This post contains content not supported on old Reddit. Click here to view the full post.</div>']:
        source = item(url='https://www.reddit.com/r/popculturechat/comments/abc123/a_post/', content=content)
        assert asyncio.run(prepare_source_evidence([source], None, SimpleNamespace(extract=extract))) == []

