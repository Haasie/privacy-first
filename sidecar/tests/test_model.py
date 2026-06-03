"""Tests for model path detection and status reporting."""
import pytest
from pathlib import Path
from unittest.mock import patch

from sidecar import model


@pytest.fixture(autouse=True)
def reset_model_dir():
    model._model_dir = None
    yield
    model._model_dir = None


def test_status_model_absent(tmp_path):
    model.set_model_dir(tmp_path / "no-such-dir")
    result = model.model_status({})
    assert result["ready"] is False
    assert result["version"] == ""
    assert "no-such-dir" in result["path"]


def test_status_model_present(tmp_path):
    model_dir = tmp_path / "openai-privacy-filter"
    model_dir.mkdir()
    (model_dir / "version.txt").write_text("openai/privacy-filter@main\n")
    model.set_model_dir(model_dir)

    result = model.model_status({})
    assert result["ready"] is True
    assert result["version"] == "openai/privacy-filter@main"
    assert result["path"] == str(model_dir)


def test_download_creates_version_file(tmp_path):
    model_dir = tmp_path / "downloaded"
    model.set_model_dir(model_dir)

    with patch("huggingface_hub.snapshot_download"):
        result = model.download_model({})

    assert (model_dir / "version.txt").exists()
    assert result["path"] == str(model_dir)


def test_download_then_status_ready(tmp_path):
    model_dir = tmp_path / "downloaded"
    model.set_model_dir(model_dir)

    with patch("huggingface_hub.snapshot_download"):
        model.download_model({})

    status = model.model_status({})
    assert status["ready"] is True
    assert status["version"] == "openai/privacy-filter@main"
