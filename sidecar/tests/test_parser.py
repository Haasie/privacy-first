"""Tests for the file parser."""
import pytest
from pathlib import Path

from sidecar import parser


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture()
def txt_file(tmp_path):
    p = tmp_path / "sample.txt"
    p.write_text("Hello, world!")
    return p


@pytest.fixture()
def pdf_file(tmp_path):
    import fitz
    p = tmp_path / "sample.pdf"
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "Hello from PDF")
    doc.save(str(p))
    doc.close()
    return p


@pytest.fixture()
def docx_file(tmp_path):
    from docx import Document
    p = tmp_path / "sample.docx"
    doc = Document()
    doc.add_paragraph("Hello from DOCX")
    doc.save(str(p))
    return p


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_parse_txt(txt_file):
    result = parser.parse_file({"path": str(txt_file)})
    assert result["text"] == "Hello, world!"


def test_parse_pdf(pdf_file):
    result = parser.parse_file({"path": str(pdf_file)})
    assert "Hello from PDF" in result["text"]
    assert "warning" not in result


def test_parse_docx(docx_file):
    result = parser.parse_file({"path": str(docx_file)})
    assert "Hello from DOCX" in result["text"]


def test_nonexistent_file(tmp_path):
    with pytest.raises(FileNotFoundError):
        parser.parse_file({"path": str(tmp_path / "missing.txt")})


def test_password_protected_pdf(tmp_path):
    import fitz
    p = tmp_path / "locked.pdf"
    doc = fitz.open()
    doc.new_page()
    # encrypt with a password
    doc.save(str(p), encryption=fitz.PDF_ENCRYPT_AES_256, user_pw="secret", owner_pw="secret")
    doc.close()

    with pytest.raises(RuntimeError, match="password-protected"):
        parser.parse_file({"path": str(p)})


def test_scanned_pdf_returns_warning(tmp_path):
    import fitz
    p = tmp_path / "scanned.pdf"
    doc = fitz.open()
    doc.new_page()  # blank page — no text layer
    doc.save(str(p))
    doc.close()

    result = parser.parse_file({"path": str(p)})
    assert result["text"] == ""
    assert "warning" in result


def test_unsupported_extension(tmp_path):
    p = tmp_path / "data.csv"
    p.write_text("a,b,c")
    with pytest.raises(ValueError, match="Unsupported file type"):
        parser.parse_file({"path": str(p)})


def test_missing_path_param():
    with pytest.raises(ValueError, match="Missing required parameter"):
        parser.parse_file({})
