"""Require readable reporting before asking a model to explain an event."""
import asyncio
import re
from urllib.parse import urlsplit

from bs4 import BeautifulSoup

from .content import COMMENTS_MARKER, split_content


def eligible_discovery_item(item):
    # Google RSS summaries are a list of headlines, not the linked reporting.
    # They remain in discovery counts; opaque redirects cannot substantiate a story.
    if (urlsplit(str(item.url)).hostname or "").endswith("news.google.com"):
        return False
    return not re.search(r"\b(coupon|promo code|author correction|corrigendum|erratum|price target)\b|\d+% off", item.title, re.I)


async def prepare_source_evidence(items, client, extractor):
    gate = asyncio.Semaphore(6)

    async def prepare(item):
        parsed = urlsplit(str(item.url))
        if parsed.hostname in {'reddit.com', 'www.reddit.com'} and re.match(r'^/r/[^/]+/comments/[a-z0-9]+/', parsed.path):
            soup = BeautifulSoup(item.content, 'html.parser')
            body = soup.select_one('div.md')
            text = body.get_text(' ', strip=True) if body else ''
            if len(text) < 20 or re.search(r'content not supported on old Reddit|click here to view|welcome to r/', text, re.I) or re.search(r'^welcome', item.title, re.I):
                return None
            item.content = 'Platform discussion / user-created text; claims not independently verified.\n' + text
            item.metadata.update(evidence_mode='platform_text', evidence_chars=len(text), platform='Reddit', content_nature='user_created', claims_verified=False)
            return item
        if item.source_type.value in {"github", "reddit", "twitter", "telegram"}:
            return item
        parts = split_content(item.content)
        excerpt = BeautifulSoup(parts.main, "html.parser").get_text(" ", strip=True)
        async with gate:
            try:
                full = await asyncio.wait_for(extractor.extract(str(item.url), client), timeout=16)
            except asyncio.TimeoutError:
                full = None
        evidence = full if full and len(full.strip()) >= 220 else excerpt
        if len(evidence.strip()) < 220:
            return None
        item.content = evidence + (f"\n\n{COMMENTS_MARKER}\n{parts.comments}" if parts.comments else "")
        item.metadata["evidence_mode"] = "article_text" if evidence == full else "feed_excerpt"
        item.metadata["evidence_chars"] = len(evidence)
        return item

    return [item for item in await asyncio.gather(*(prepare(item) for item in items)) if item is not None]


def has_localized_artifact(item, language):
    artifact = item.processing.artifacts.get(language) if item.processing else None
    if not artifact or not artifact.title.strip():
        return False
    if language == "zh" and len(re.findall(r"[\u3400-\u9fff]", artifact.title)) < 3:
        return False
    return any(block.primary and block.content.strip() for block in artifact.blocks)


def validate_edition_size(available, selected, language):
    """Reject a processing collapse without imposing a quota on quiet days."""
    if available < min(10, selected) or available == 0:
        raise RuntimeError(
            f"Incomplete {language} edition: {available}/{selected} stories; preserving the previous published edition"
        )

