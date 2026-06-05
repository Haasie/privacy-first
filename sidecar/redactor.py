"""Core PII redaction using the openai/privacy-filter OPF model.

Placeholder format in output: <PRIVATE_PERSON>, <PRIVATE_EMAIL>, etc.
(OPF's native format — uppercase angle-bracket labels.)
"""
from pathlib import Path

from . import errors, ipc, model

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


_CARD_BRANDS = ("MasterCard", "Visa", "Amex", "American Express", "Maestro", "Discover")

# Per-label colors: (fill RGB, text RGB) — matches the frontend preview panel palette.
_LABEL_STYLE: dict[str, tuple] = {
    "private_person":      ((0.78, 0.90, 0.98), (0.04, 0.35, 0.65)),
    "private_email":       ((0.78, 0.95, 0.90), (0.02, 0.45, 0.35)),
    "private_phone":       ((1.00, 0.93, 0.80), (0.58, 0.28, 0.02)),
    "private_address":     ((0.94, 0.86, 0.98), (0.48, 0.10, 0.68)),
    "private_id":          ((1.00, 0.86, 0.86), (0.68, 0.08, 0.08)),
    "private_url":         ((0.83, 0.96, 1.00), (0.02, 0.48, 0.58)),
    "private_date":        ((1.00, 0.96, 0.76), (0.58, 0.42, 0.00)),
    "private_organization":((1.00, 0.86, 0.93), (0.68, 0.08, 0.38)),
    "account_number":      ((1.00, 0.86, 0.86), (0.68, 0.08, 0.08)),
}
_DEFAULT_STYLE = ((0.86, 0.86, 0.86), (0.18, 0.18, 0.18))


def _placeholder(label: str) -> str:
    return f"<{label.upper()}>"


def _annotate(page, rect, label: str) -> None:
    fill, text_color = _LABEL_STYLE.get(label, _DEFAULT_STYLE)
    page.add_redact_annot(
        rect,
        text=_placeholder(label),
        fontname="helv",
        fontsize=7.5,
        align=1,
        fill=fill,
        text_color=text_color,
    )


def _redact_pdf(source: Path, spans: list, output: Path) -> None:
    import fitz
    doc = fitz.open(str(source))
    for page in doc:
        for span in spans:
            label = span["label"]
            for part in span["original_value"].split("\n"):
                part = part.strip()
                if not part:
                    continue
                for rect in page.search_for(part):
                    _annotate(page, rect, label)

        # Payment card lines: redact brand name + card suffix on the same line.
        # Extend 250 pt right — covers "··· XXXX" without spanning the full page.
        for brand in _CARD_BRANDS:
            for brand_rect in page.search_for(brand):
                card_line = fitz.Rect(
                    brand_rect.x0,
                    brand_rect.y0,
                    min(brand_rect.x0 + 250, page.rect.width - 10),
                    brand_rect.y1,
                )
                _annotate(page, card_line, "account_number")

        page.apply_redactions()
    doc.save(str(output), garbage=4, deflate=True)


def _redact_docx(source: Path, spans: list, output: Path) -> None:
    from docx import Document
    doc = Document(str(source))
    for para in doc.paragraphs:
        for span in spans:
            val = span["original_value"]
            label = span["label"].upper()
            for run in para.runs:
                if val in run.text:
                    run.text = run.text.replace(val, f"<{label}>")
    doc.save(str(output))


@ipc.register("save_redacted_file")
def save_redacted_file(params: dict) -> dict:
    source_path = params.get("source_path", "")
    redacted_text = params.get("redacted_text", "")
    spans = params.get("spans", [])
    output_dir = params.get("output_dir")

    source = Path(source_path)
    ext = source.suffix.lower()
    out_dir = Path(output_dir) if output_dir else source.parent
    out_dir.mkdir(parents=True, exist_ok=True)
    out_ext = ext if ext in (".pdf", ".docx") else ".txt"
    output = out_dir / f"{source.stem}_redacted{out_ext}"

    if ext == ".pdf":
        _redact_pdf(source, spans, output)
    elif ext == ".docx":
        _redact_docx(source, spans, output)
    else:
        output.write_text(redacted_text, encoding="utf-8")

    return {"path": str(output)}


@ipc.register("redact")
def redact(params: dict) -> dict:
    if not (text := params.get("text", "")):
        return {"redacted_text": "", "spans": []}

    try:
        result = _get_opf().redact(text)
    except Exception as exc:
        msg = str(exc).lower()
        if any(w in msg for w in ("memory", "cuda out of memory", "oom")):
            raise errors.SidecarError(errors.MODEL_OOM, "Not enough memory to process this document — try a shorter text")
        raise

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
