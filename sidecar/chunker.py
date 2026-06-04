"""Text chunker — splits large documents for per-chunk redaction."""
from typing import Callable

CHARS_PER_TOKEN = 4
MAX_TOKENS = 128_000
_DEFAULT_MAX_CHARS = MAX_TOKENS * CHARS_PER_TOKEN  # ~512K chars
_LOOK_BACK = 1_000  # search window for a clean split point


def _split_point(text: str, target: int) -> int:
    """Return the best split index at or before `target`."""
    window_start = max(0, target - _LOOK_BACK)
    window = text[window_start:target]
    for sep in ("\n\n", "\n", ". ", " "):
        idx = window.rfind(sep)
        if idx != -1:
            return window_start + idx + len(sep)
    return target


def chunk_and_redact(
    text: str,
    redact_fn: Callable[[str], dict],
    max_chars: int = _DEFAULT_MAX_CHARS,
) -> dict:
    """
    Redact `text`, chunking if it exceeds `max_chars`.

    `redact_fn` must accept a str and return {"redacted_text": str, "spans": list}.
    Span start/end in the returned dict are absolute offsets into the original text.
    """
    if len(text) <= max_chars:
        return redact_fn(text)

    redacted_parts: list[str] = []
    all_spans: list[dict] = []
    pos = 0

    while pos < len(text):
        end = min(pos + max_chars, len(text))
        if end < len(text):
            end = _split_point(text, end)
            if end <= pos:
                end = pos + max_chars  # safety: always advance

        chunk_text = text[pos:end]
        result = redact_fn(chunk_text)
        redacted_parts.append(result["redacted_text"])

        for span in result["spans"]:
            all_spans.append({
                "start": pos + span["start"],
                "end": pos + span["end"],
                "label": span["label"],
                "original_value": span["original_value"],
            })

        pos = end

    return {"redacted_text": "".join(redacted_parts), "spans": all_spans}
