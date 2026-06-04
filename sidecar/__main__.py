"""Privacy-first sidecar — stdin/stdout JSON-RPC server."""
import argparse
from pathlib import Path

from . import ipc
from . import model     # registers model_status and download_model handlers
from . import redactor  # registers redact handler
from . import parser    # registers parse_file handler


@ipc.register("ping")
def ping(_params: dict) -> str:
    return "pong"


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="privacy-first sidecar")
    parser.add_argument(
        "--model-dir",
        type=Path,
        metavar="PATH",
        help="Model directory (default: next to sidecar binary)",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    if args.model_dir:
        model.set_model_dir(args.model_dir)
    ipc.serve()
