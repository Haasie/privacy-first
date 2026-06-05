"""Detection and download of the openai/privacy-filter model.

Call set_model_dir() at startup to override the default path.
Default: Path(sys.executable).parent / "models" / "openai-privacy-filter"

In production the Tauri host always passes --model-dir pointing at the OS
user-data dir (e.g. ~/Library/Application Support/nl.haasie.privacy-first/
models/openai-privacy-filter on macOS). Writing into the .app bundle next to
the sidecar binary is avoided: it needs admin rights under /Applications and
invalidates the code signature. The default above is only a dev fallback.
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

    Uses allow_patterns=["original/*"] — the opf checkpoint layout — then
    promotes those files to the model root, matching opf's own downloader.
    Blocking — the IPC server cannot process other requests during download.
    """
    import shutil
    from huggingface_hub import snapshot_download

    model_dir = get_model_dir()
    model_dir.mkdir(parents=True, exist_ok=True)

    snapshot_download(
        repo_id="openai/privacy-filter",
        local_dir=str(model_dir),
        allow_patterns=["original/*"],
    )

    # Promote original/* to root (opf's expected layout).
    original_dir = model_dir / "original"
    if original_dir.is_dir():
        for src in original_dir.iterdir():
            dest = model_dir / src.name
            if dest.exists():
                dest.unlink() if dest.is_file() else shutil.rmtree(str(dest))
            shutil.move(str(src), str(dest))
        original_dir.rmdir()

    # Version marker written last so status() only reports ready after
    # a complete, successful download.
    (model_dir / "version.txt").write_text("openai/privacy-filter@main\n")
    return {"path": str(model_dir)}
