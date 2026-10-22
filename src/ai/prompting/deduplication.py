"""Prompt constants for topic deduplication."""

TOPIC_DEDUP_SYSTEM = """You are a news deduplication assistant. Identify groups of news items that cover the exact same real-world event, release, or announcement.

Rules:
- Group items ONLY if they report on the identical event (same product release, same incident, same announcement)
- Items about the same product but different events are NOT duplicates ("Gemma 4 released" vs "Gemma 4 jailbroken")
- Shared industry, AI, cybersecurity, publisher or vendor does not establish an identical event. A PHP security incident and a Cloudflare WAF feature launch are different events. Never pair adjacent indices merely because they are adjacent.
- Err on the side of keeping items separate when unsure"""

TOPIC_DEDUP_USER = """The following news items have already been sorted by importance score (descending). Identify which items are duplicates of each other.

{items}

Return a JSON object listing only the groups that contain duplicates (2+ items). Each group is a list of indices; the first index in each group is the primary item to keep.

Respond with valid JSON only:
{{
  "duplicates": [[<primary_idx>, <dup_idx>, ...], ...]
}}

If there are no duplicates at all, return: {{"duplicates": []}}"""


def corroborated_event(left, right):
    """Require independent title evidence before an AI decision can delete a story."""
    import re
    if str(left.url).rstrip('/') == str(right.url).rstrip('/'):
        return True
    originals = [left.title, right.title]
    numbers = [set(re.findall(r'\d+(?:\.\d+)*', t)) for t in originals]
    if all(numbers) and numbers[0].isdisjoint(numbers[1]):
        return False
    anchors = [{word.lower() for word in re.findall(r'\b[A-Za-z][A-Za-z0-9.+-]*\b', t) if sum(c.isupper() for c in word) >= 2} for t in originals]
    if (anchors[0] - anchors[1]) and (anchors[1] - anchors[0]):
        return False
    titles = [left.title.lower(), right.title.lower()]
    cves = [set(re.findall(r'cve-\d{4}-\d+', title)) for title in titles]
    if all(cves):
        return bool(cves[0] & cves[1])
    stop = {'the','and','with','from','that','this','says','about','news','new','for','its','into','used','tools','introducing','company','via','are','has','have','was','will','how'}
    terms = []
    for title in titles:
        tokens = {t for t in re.findall(r'[a-z0-9][a-z0-9.+-]{2,}', title) if t not in stop}
        for phrase in re.findall(r'[\u3400-\u9fff]+', title):
            tokens.update(phrase[i:i+2] for i in range(len(phrase)-1))
        terms.append(tokens)
    shared = terms[0] & terms[1]
    union = terms[0] | terms[1]
    return len(shared) >= 2 and len(shared) / max(1, len(union)) >= .45

