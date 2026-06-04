"""Tests for the core redaction command."""
import pytest
from unittest.mock import MagicMock, patch

from sidecar import redactor


@pytest.fixture(autouse=True)
def reset_opf():
    redactor._reset_opf()
    yield
    redactor._reset_opf()


def _make_span(label: str, start: int, end: int, text: str):
    span = MagicMock()
    span.label = label
    span.start = start
    span.end = end
    span.text = text
    return span


def _mock_opf(spans: list, redacted_text: str):
    result = MagicMock()
    result.detected_spans = spans
    result.redacted_text = redacted_text
    opf_instance = MagicMock()
    opf_instance.redact.return_value = result
    return opf_instance


def test_redact_multiple_pii_types():
    spans = [
        _make_span("private_person", 0, 4, "John"),
        _make_span("private_email", 9, 29, "john@example.com"),
    ]
    mock = _mock_opf(spans, "<PRIVATE_PERSON> is at <PRIVATE_EMAIL>")

    with patch("sidecar.redactor._get_opf", return_value=mock):
        result = redactor.redact({"text": "John is at john@example.com"})

    assert result["redacted_text"] == "<PRIVATE_PERSON> is at <PRIVATE_EMAIL>"
    assert len(result["spans"]) == 2
    assert result["spans"][0] == {
        "start": 0, "end": 4, "label": "private_person", "original_value": "John",
    }
    assert result["spans"][1]["label"] == "private_email"
    assert result["spans"][1]["original_value"] == "john@example.com"


def test_redact_no_pii():
    mock = _mock_opf([], "Hello world, nothing private here.")

    with patch("sidecar.redactor._get_opf", return_value=mock):
        result = redactor.redact({"text": "Hello world, nothing private here."})

    assert result["redacted_text"] == "Hello world, nothing private here."
    assert result["spans"] == []


def test_redact_empty_string():
    result = redactor.redact({"text": ""})
    assert result == {"redacted_text": "", "spans": []}


def test_redact_missing_text_key():
    result = redactor.redact({})
    assert result == {"redacted_text": "", "spans": []}
