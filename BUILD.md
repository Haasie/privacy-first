# Build Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Rust + Cargo | stable | Tauri app shell |
| Node.js | ≥20 | Frontend build |
| Python | 3.11–3.14 | Sidecar |
| rustup | any | Target triple detection |

Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

---

## 1. Set up the Python sidecar environment

```bash
python3 -m venv sidecar/.venv
sidecar/.venv/bin/pip install -e "sidecar[dev]"
```

On Windows:
```bat
python -m venv sidecar\.venv
sidecar\.venv\Scripts\pip install -e "sidecar[dev]"
```

---

## 2. Build the sidecar binary

**macOS / Linux:**
```bash
bash sidecar/build.sh
```

**Windows:**
```bat
sidecar\build.bat
```

The script auto-detects the Rust target triple (e.g. `aarch64-apple-darwin`,
`x86_64-pc-windows-msvc`) and writes a platform-suffixed binary to
`src-tauri/binaries/`. Tauri bundles this binary alongside the app.

---

## 3. Install frontend dependencies

```bash
npm install
```

---

## 4. Development run (without Rust binary required)

```bash
npm run tauri dev
```

This requires `rustup` and will compile the Rust shell on first run (~2–5 min).

---

## 5. Production build

```bash
npm run tauri build
```

Output:
- macOS: `src-tauri/target/release/bundle/dmg/*.dmg`
- Windows: `src-tauri/target/release/bundle/msi/*.msi`

---

## Code signing

### macOS

Set these environment variables before `npm run tauri build`:

```bash
export APPLE_CERTIFICATE="<base64-encoded .p12>"
export APPLE_CERTIFICATE_PASSWORD="<cert password>"
export APPLE_SIGNING_IDENTITY="Developer ID Application: Your Name (TEAMID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="<app-specific password>"
export APPLE_TEAM_ID="<your team ID>"
```

Signing and notarization run automatically when these are set.

### Windows

```bat
set WINDOWS_CERTIFICATE_THUMBPRINT=<thumbprint>
set WINDOWS_CERTIFICATE_PASSWORD=<password>
```

---

## Sidecar binary location

Tauri expects: `src-tauri/binaries/sidecar-{target-triple}`

The build scripts write the binary there automatically. The `externalBin`
entry in `tauri.conf.json` is `binaries/sidecar` — Tauri appends the
platform suffix at bundle time.

---

## Troubleshooting

**`sidecar terminated unexpectedly` at launch** — the sidecar binary is missing
or not executable. Re-run `sidecar/build.sh` and confirm the binary exists in
`src-tauri/binaries/`.

**PyInstaller can't find `fitz`** — run
`sidecar/.venv/bin/pip install pymupdf` and re-run the build script.

**macOS Gatekeeper blocks the sidecar** — code-sign or ad-hoc sign with
`codesign -s - src-tauri/binaries/sidecar-*` for local testing.
