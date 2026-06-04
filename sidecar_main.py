"""PyInstaller entry point for the privacy-first sidecar.

Development: use `python -m sidecar` (runs sidecar/__main__.py).
Production:  PyInstaller builds this file into the single-file binary.

Absolute imports are required here — PyInstaller runs this as a top-level
script, so relative imports (from . import ...) would fail.
"""
import argparse
from pathlib import Path

from sidecar import ipc, model, redactor, parser  # registers their IPC handlers


@ipc.register("ping")
def ping(_params: dict) -> str:
    return "pong"


def main() -> None:
    p = argparse.ArgumentParser(description="privacy-first sidecar")
    p.add_argument("--model-dir", type=Path, metavar="PATH")
    args = p.parse_args()
    if args.model_dir:
        model.set_model_dir(args.model_dir)
    ipc.serve()


if __name__ == "__main__":
    main()
