#!/usr/bin/env bash
# Build the Python sidecar as a self-contained binary for macOS (or Linux).
# Run from the project root: bash sidecar/build.sh
set -euo pipefail

# ── Detect Rust target triple ─────────────────────────────────────────────────
if command -v rustc &>/dev/null; then
  TARGET=$(rustc -vV 2>/dev/null | awk '/^host:/{print $2}')
else
  # Fallback: derive from uname (no rustup required)
  ARCH=$(uname -m)
  OS=$(uname -s)
  case "$OS" in
    Darwin) TARGET="${ARCH/arm64/aarch64}-apple-darwin" ;;
    Linux)  TARGET="${ARCH}-unknown-linux-gnu" ;;
    *)      echo "Unsupported OS: $OS"; exit 1 ;;
  esac
fi
echo "Target triple: $TARGET"

# ── Install build dependencies ────────────────────────────────────────────────
PYTHON=sidecar/.venv/bin/python
if [ ! -f "$PYTHON" ]; then
  echo "Error: sidecar/.venv not found. Run: python3 -m venv sidecar/.venv && $PYTHON -m pip install -e 'sidecar[dev]'"
  exit 1
fi
$PYTHON -m pip install pyinstaller --quiet

# ── Build ─────────────────────────────────────────────────────────────────────
mkdir -p src-tauri/binaries
$PYTHON -m PyInstaller \
  --onefile \
  --name "sidecar-${TARGET}" \
  --distpath src-tauri/binaries \
  --specpath /tmp/privacy-first-spec \
  --collect-all sidecar \
  --collect-all tiktoken \
  --collect-all tiktoken_ext \
  --collect-all opf \
  --hidden-import fitz \
  --clean \
  --noconfirm \
  sidecar_main.py

echo "Done: src-tauri/binaries/sidecar-${TARGET}"
