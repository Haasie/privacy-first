"""JSON-RPC 2.0 server over stdin/stdout.

All sidecar commands register via @ipc.register("method_name").
serve() blocks until stdin is closed (EOF = clean shutdown).
"""
import sys
import json
from typing import Any, Callable

Handler = Callable[[dict[str, Any]], Any]

_handlers: dict[str, Handler] = {}


def register(method: str) -> Callable[[Handler], Handler]:
    """Decorator: register a function as the handler for a JSON-RPC method."""
    def decorator(fn: Handler) -> Handler:
        _handlers[method] = fn
        return fn
    return decorator


def _write(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload) + "\n")
    sys.stdout.flush()


def serve() -> None:
    """Block and dispatch JSON-RPC requests from stdin until EOF."""
    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue

        try:
            req = json.loads(raw)
        except json.JSONDecodeError:
            _write({"id": None, "error": {"code": -32700, "message": "Parse error"}})
            continue

        req_id = req.get("id")
        method = req.get("method")
        params = req.get("params") or {}

        if not isinstance(method, str) or method not in _handlers:
            _write({"id": req_id, "error": {"code": -32601, "message": f"Method not found: {method!r}"}})
            continue

        try:
            result = _handlers[method](params)
            _write({"id": req_id, "result": result})
        except Exception as exc:
            _write({"id": req_id, "error": {"code": -32603, "message": str(exc)}})
