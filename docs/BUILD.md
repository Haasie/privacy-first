# Build Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Rust | ≥ 1.77 | Tauri shell |
| Node.js | ≥ 20 | Frontend build |
| Python | 3.11 | Sidecar binary |
| PyInstaller | ≥ 6 | Package Python into binary |

Install Rust via [rustup.rs](https://rustup.rs). Install Node.js via [nodejs.org](https://nodejs.org). Python 3.11 from [python.org](https://python.org).

## First-time setup

```bash
# 1. Frontend dependencies
npm install

# 2. Python sidecar dependencies (includes PyInstaller)
pip install "sidecar/[dev]"
```

## Download the AI model

The sidecar downloads the model on first launch through the Setup Wizard in the app. To download manually (for offline use or CI):

```bash
cd sidecar
python -c "
from huggingface_hub import snapshot_download
import shutil, pathlib

model_dir = pathlib.Path('models/openai-privacy-filter')
model_dir.mkdir(parents=True, exist_ok=True)
snapshot_download('openai/privacy-filter', local_dir=str(model_dir), allow_patterns=['original/*'])
original = model_dir / 'original'
for f in original.iterdir():
    dest = model_dir / f.name
    if dest.exists(): dest.unlink() if dest.is_file() else shutil.rmtree(dest)
    shutil.move(str(f), str(dest))
original.rmdir()
"
```

## Development

```bash
npm run tauri dev
```

This starts the Vite dev server and the Tauri window simultaneously. Hot-reload applies to the frontend; Rust changes require a restart.

The Python sidecar runs from `target/debug/sidecar` during development. The model is expected at `target/debug/models/openai-privacy-filter/`.

## Build the sidecar binary

The sidecar must be compiled with PyInstaller before a production build. This step is platform-specific — run it on the target OS.

```bash
cd sidecar
bash build.sh
```

Output: `src-tauri/binaries/sidecar-<target-triple>` (e.g. `sidecar-aarch64-apple-darwin` on Apple Silicon).

The script uses `--collect-all tiktoken_ext` and `--collect-all opf` to bundle runtime plugins that PyInstaller misses by default.

## Production build

After the sidecar binary exists in `src-tauri/binaries/`:

```bash
npm run tauri build
```

Output installers are written to `src-tauri/target/release/bundle/`:

| Platform | Format | Path |
|----------|--------|------|
| macOS | `.dmg` | `bundle/dmg/Privacy First_<version>_<arch>.dmg` |
| macOS | `.app` | `bundle/macos/Privacy First.app` |
| Windows | NSIS `.exe` | `bundle/nsis/Privacy First_<version>_x64-setup.exe` |

## CI/CD

Pushing a semver tag triggers the GitHub Actions release workflow:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow (`.github/workflows/release.yml`) builds for:
- macOS Apple Silicon (`aarch64-apple-darwin`)
- macOS Intel (`x86_64-apple-darwin`)
- Windows 64-bit (`x86_64-pc-windows-msvc`)

Each job builds the Python sidecar natively on its runner, then calls `tauri-action` to bundle and publish a GitHub Release draft.

## Code signing (optional)

Without signing, macOS shows "unidentified developer" and Windows Defender shows SmartScreen. For internal distribution this is acceptable (users dismiss it once).

For public distribution, add these secrets to your GitHub repository:

**macOS** (requires Apple Developer membership):
- `APPLE_CERTIFICATE` — base64-encoded `.p12` certificate
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_ID` — your Apple ID email
- `APPLE_PASSWORD` — app-specific password
- `APPLE_TEAM_ID`

**Windows** (requires a code signing certificate):
- `WINDOWS_CERTIFICATE`
- `WINDOWS_CERTIFICATE_PASSWORD`

Uncomment the relevant lines in `release.yml` after adding secrets.
