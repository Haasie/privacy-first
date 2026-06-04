"""Tests for the text chunker."""
from sidecar.chunker import chunk_and_redact


def _mock_redact(text: str) -> dict:
    """Simulate redaction: replace 'SECRET' with '<REDACTED>', emit one span per match."""
    spans = []
    out = []
    i = 0
    token = "SECRET"
    while i < len(text):
        idx = text.find(token, i)
        if idx == -1:
            out.append(text[i:])
            break
        out.append(text[i:idx])
        spans.append({"start": idx, "end": idx + len(token), "label": "test", "original_value": token})
        out.append("<REDACTED>")
        i = idx + len(token)
    return {"redacted_text": "".join(out), "spans": spans}


def test_short_text_no_split():
    """Text within limit: redact_fn called once, result returned as-is."""
    text = "Call SECRET now."
    calls = []

    def tracking_redact(t):
        calls.append(t)
        return _mock_redact(t)

    result = chunk_and_redact(text, tracking_redact, max_chars=100)
    assert len(calls) == 1
    assert result["redacted_text"] == "Call <REDACTED> now."
    assert result["spans"][0]["start"] == 5
    assert result["spans"][0]["end"] == 11


def test_exact_boundary_no_split():
    """Text exactly at max_chars: treated as a single chunk."""
    text = "a" * 50
    calls = []

    def counting_redact(t):
        calls.append(t)
        return {"redacted_text": t, "spans": []}

    chunk_and_redact(text, counting_redact, max_chars=50)
    assert len(calls) == 1


def test_long_text_splits_into_chunks():
    """Text over limit: redact_fn called multiple times."""
    # 3 words separated by spaces; split at word boundaries
    text = ("word " * 20).rstrip()  # 99 chars with max_chars=50
    calls = []

    def counting_redact(t):
        calls.append(t)
        return {"redacted_text": t, "spans": []}

    chunk_and_redact(text, counting_redact, max_chars=50)
    assert len(calls) >= 2


def test_offset_correctness_after_merge():
    """Spans in later chunks must have offsets relative to the full document."""
    # Two halves: SECRET appears in second half
    first_half = "clean text here. "           # 17 chars
    second_half = "SECRET is here."             # 15 chars
    text = first_half + second_half            # SECRET starts at offset 17

    result = chunk_and_redact(text, _mock_redact, max_chars=20)

    assert len(result["spans"]) == 1
    span = result["spans"][0]
    assert span["start"] == 17
    assert span["end"] == 23
    assert span["original_value"] == "SECRET"


def test_spans_from_both_chunks():
    """Spans from all chunks are merged in document order."""
    # Force split between the two SECRETs
    text = "A SECRET here.\nAnd another SECRET there."
    # max_chars=20 will split somewhere in the middle
    result = chunk_and_redact(text, _mock_redact, max_chars=20)

    assert len(result["spans"]) == 2
    assert result["spans"][0]["start"] < result["spans"][1]["start"]
    # First SECRET starts at index 2
    assert result["spans"][0]["start"] == 2
    # Second SECRET starts at index 28 in original
    assert result["spans"][1]["start"] == text.index("SECRET", 10)
