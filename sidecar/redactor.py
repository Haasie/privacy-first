"""Core PII redaction using the openai/privacy-filter OPF model.

Placeholder format in output: <PRIVATE_PERSON>, <PRIVATE_EMAIL>, etc.
(OPF's native format — uppercase angle-bracket labels.)
"""
from . import ipc, model

_opf = None  # lazy-initialized; loading the model is expensive


def _get_opf():
    global _opf
    if _opf is None:
        from opf import OPF
        _opf = OPF(
            model=str(model.get_model_dir()),
            device="cpu",
            output_mode="typed",
        )
    return _opf


def _reset_opf() -> None:
    """Drop the cached OPF instance. Used in tests."""
    global _opf
    _opf = None


@ipc.register("redact")
def redact(params: dict) -> dict:
    if not (text := params.get("text", "")):
        return {"redacted_text": "", "spans": []}

    result = _get_opf().redact(text)

    spans = [
        {
            "start": span.start,
            "end": span.end,
            "label": span.label,
            "original_value": span.text,
        }
        for span in result.detected_spans
    ]
    return {"redacted_text": result.redacted_text, "spans": spans}
