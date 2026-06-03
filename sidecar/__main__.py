"""Privacy-first sidecar entry point — placeholder until Task 2."""
import sys
import json


def main() -> None:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            print(json.dumps({"id": req.get("id"), "result": "pong"}), flush=True)
        except json.JSONDecodeError:
            print(
                json.dumps({"id": None, "error": {"code": -32700, "message": "Parse error"}}),
                flush=True,
            )


if __name__ == "__main__":
    main()
