"""A reaction clipping must have an allowed, safe source and escaped content."""
import json
from types import SimpleNamespace

from src.ai.summarizer import _render_reactions


def render(records, refs=("tool-2-1",), discussion=None):
    block = SimpleNamespace(content=json.dumps({"reactions": records}), source_refs=refs)
    sources = [SimpleNamespace(id="tool-2-1", url="https://example.org/interview")]
    return _render_reactions(block, sources, "https://example.org/report", "zh", discussion)


def record(**changes):
    return {"stance": "criticism", "speaker": "受访者", "text": "她担心这会增加成本。", "source_ref": "tool-2-1", **changes}


def test_citation_must_belong_to_this_block():
    assert render([record()], refs=()) == ""
    assert render([record(source_ref="tool-9-1")]) == ""


def test_one_voice_does_not_manufacture_a_second_side():
    output = render([record()])
    assert output.count('class="reaction-clip"') == 1
    assert 'https://example.org/interview' in output
    assert "赞成的理由" not in output


def test_discussion_requires_supplied_link_and_safe_scheme():
    assert render([record(source_ref="discussion")]) == ""
    assert render([record(source_ref="discussion")], discussion="javascript:alert(1)") == ""
    assert "news.ycombinator.com/item?id=123" in render([record(source_ref="discussion")], discussion="https://news.ycombinator.com/item?id=123")


def test_model_cannot_inject_html_or_dynamic_stance_attributes():
    output = render([record(speaker='<script>alert(1)</script>', text='<img src=x onerror=alert(1)>', stance=["malformed"])])
    assert "<script>" not in output and "<img " not in output
    assert "&lt;script&gt;" in output and 'data-stance="other"' in output


def test_invalid_payload_never_shows_raw_json():
    block = SimpleNamespace(content='{"reactions": broken', source_refs=[])
    assert _render_reactions(block, [], "https://example.org/", "zh") == ""


def test_duplicate_voices_and_unbounded_records_are_not_rendered():
    assert render([record(), record()]).count('class="reaction-clip"') == 1
    assert render([record(speaker=str(i)) for i in range(8)]).count('class="reaction-clip"') == 4
