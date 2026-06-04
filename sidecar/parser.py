"""File parser — extract plain text from .txt, .pdf, and .docx files."""
from pathlib import Path

from . import ipc


def _parse_txt(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    return {"text": text}


def _parse_pdf(path: Path) -> dict:
    import fitz  # PyMuPDF

    doc = fitz.open(str(path))
    if doc.needs_pass:
        raise RuntimeError("PDF is password-protected")

    pages = [page.get_text() for page in doc]
    text = "\n".join(pages)

    if not text.strip():
        return {"text": "", "warning": "No extractable text found — document may be a scanned image"}

    return {"text": text}


def _parse_docx(path: Path) -> dict:
    from docx import Document

    doc = Document(str(path))
    text = "\n".join(p.text for p in doc.paragraphs)
    return {"text": text}


@ipc.register("parse_file")
def parse_file(params: dict) -> dict:
    raw = params.get("path", "")
    if not raw:
        raise ValueError("Missing required parameter: path")

    path = Path(raw)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    ext = path.suffix.lower()
    if ext == ".txt":
        return _parse_txt(path)
    elif ext == ".pdf":
        return _parse_pdf(path)
    elif ext == ".docx":
        return _parse_docx(path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
