"""Privacy-first sidecar — stdin/stdout JSON-RPC server."""
from . import ipc


@ipc.register("ping")
def ping(_params: dict) -> str:
    return "pong"


if __name__ == "__main__":
    ipc.serve()
