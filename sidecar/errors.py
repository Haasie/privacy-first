"""Sidecar error codes and SidecarError exception."""

# JSON-RPC application error codes (range: -32099 to -32000)
EMPTY_INPUT = -32001
SCANNED_PDF = -32002
MODEL_OOM   = -32003
PARSE_FAILURE = -32004


class SidecarError(Exception):
    """Raised by sidecar handlers to return a specific error code to the frontend."""

    def __init__(self, code: int, message: str) -> None:
        super().__init__(message)
        self.code = code
