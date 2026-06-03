"""Detection and download of the openai/privacy-filter model.

Call set_model_dir() at startup to override the default path.
Default: Path(sys.executable).parent / "models" / "openai-privacy-filter"
In PyInstaller builds sys.executable is the sidecar binary, so this puts
the model directory next to the Tauri app binary as required by FR-011.
"""
import sys
from pathlib import Path

from . import ipc

_model_dir: Path | None = None


def set_model_dir(path: Path) -> None:
    global _model_dir
    _model_dir = path


def get_model_dir() -> Path:
    if _model_dir is not None:
        return _model_dir
    return Path(sys.executable).parent / "models" / "openai-privacy-filter"


@ipc.register("model_status")
def model_status(_params: dict) -> dict:
    model_dir = get_model_dir()
    version_file = model_dir / "version.txt"
    ready = version_file.exists()
    return {
        "ready": ready,
        "path": str(model_dir),
        "version": version_file.read_text().strip() if ready else "",
    }


@ipc.register("download_model")
def download_model(_params: dict) -> dict:
    """Download openai/privacy-filter from HuggingFace Hub.

    Blocking — the IPC server cannot process other requests during download.
    The wizard should show an indeterminate spinner while this runs.
    Progress streaming is deferred to Task 8.
    """
    from huggingface_hub import snapshot_download

    model_dir = get_model_dir()
    model_dir.mkdir(parents=True, exist_ok=True)

    snapshot_download(repo_id="openai/privacy-filter", local_dir=str(model_dir))

    # Version marker written last so status() only reports ready after
    # a complete, successful download.
    (model_dir / "version.txt").write_text("openai/privacy-filter@main\n")
    return {"path": str(model_dir)}
