"""Tests for the JSON-RPC IPC dispatcher."""
import json
import pytest
from io import StringIO
from unittest.mock import patch

from sidecar import ipc


@pytest.fixture(autouse=True)
def clean_handlers():
    """Isolate handler registry between tests."""
    ipc._handlers.clear()
    yield
    ipc._handlers.clear()


def _call(requests: list[dict]) -> list[dict]:
    """Run ipc.serve() against a list of requests; return parsed responses."""
    stdin_data = "".join(json.dumps(r) + "\n" for r in requests)
    stdout = StringIO()
    with patch("sys.stdin", StringIO(stdin_data)), patch("sys.stdout", stdout):
        ipc.serve()
    stdout.seek(0)
    return [json.loads(line) for line in stdout if line.strip()]


def test_ping():
    @ipc.register("ping")
    def _ping(_params):
        return "pong"

    responses = _call([{"id": 1, "method": "ping", "params": {}}])
    assert responses == [{"id": 1, "result": "pong"}]


def test_malformed_json():
    stdout = StringIO()
    with patch("sys.stdin", StringIO("not valid json\n")), patch("sys.stdout", stdout):
        ipc.serve()
    stdout.seek(0)
    response = json.loads(stdout.read().strip())
    assert response["id"] is None
    assert response["error"]["code"] == -32700


def test_unknown_method():
    responses = _call([{"id": 2, "method": "does_not_exist", "params": {}}])
    assert responses[0]["error"]["code"] == -32601


def test_handler_exception():
    @ipc.register("boom")
    def _bad(_params):
        raise RuntimeError("something went wrong")

    responses = _call([{"id": 3, "method": "boom", "params": {}}])
    assert responses[0]["error"]["code"] == -32603
    assert "something went wrong" in responses[0]["error"]["message"]


def test_empty_lines_ignored():
    stdout = StringIO()
    with patch("sys.stdin", StringIO("\n\n\n")), patch("sys.stdout", stdout):
        ipc.serve()
    assert stdout.getvalue() == ""
