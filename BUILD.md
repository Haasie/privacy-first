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

## Model location

The ~2.6 GB `openai/privacy-filter` model is **not** stored inside the app
bundle. The Tauri host (`src-tauri/src/lib.rs`) passes `--model-dir` to the
sidecar pointing at the OS user-data dir, creating it if needed:

| Platform | Path |
|----------|------|
| macOS    | `~/Library/Application Support/nl.haasie.privacy-first/models/openai-privacy-filter` |
| Linux    | `~/.local/share/nl.haasie.privacy-first/models/openai-privacy-filter` |
| Windows  | `%APPDATA%\nl.haasie.privacy-first\models\openai-privacy-filter` |

This avoids two problems with writing next to the sidecar binary (which lives
inside `Privacy First.app/Contents/MacOS/`): it would require admin rights when
the app is installed in `/Applications`, and it would invalidate the bundle's
code signature, triggering the "app is damaged" Gatekeeper error on the next
launch.

The Python sidecar writes the model directly with its own filesystem calls, so
no Tauri `fs` capability scope is required for this path — the `fs` permissions
in `src-tauri/capabilities/default.json` only govern frontend access.

To reclaim disk space, delete that directory; the app re-downloads the model on
next use.

---

## Troubleshooting

**`sidecar terminated unexpectedly` at launch** — the sidecar binary is missing
or not executable. Re-run `sidecar/build.sh` and confirm the binary exists in
`src-tauri/binaries/`.

**PyInstaller can't find `fitz`** — run
`sidecar/.venv/bin/pip install pymupdf` and re-run the build script.

**macOS Gatekeeper blocks the sidecar** — code-sign or ad-hoc sign with
`codesign -s - src-tauri/binaries/sidecar-*` for local testing.

**App won't open / "Privacy First is damaged and can't be opened"** — the app
bundle must carry a valid (at minimum ad-hoc) code signature, otherwise macOS
kills it on launch from Finder on Apple Silicon. This is configured via
`bundle.macOS.signingIdentity: "-"` in `tauri.conf.json`, which makes Tauri run a
proper `codesign --deep` pass over the whole `.app` (sealing it with
`Contents/_CodeSignature/CodeResources`). Verify a build with:

```bash
codesign --verify --deep --strict --verbose=2 "src-tauri/target/release/bundle/macos/Privacy First.app"
# expected: "valid on disk" + "satisfies its Designated Requirement"
```

Without a Developer ID certificate + notarization (see Code signing above), a
**downloaded** build (e.g. the CI `.dmg`) is still quarantined and shows an
"unidentified developer" prompt — bypass it once via right-click → Open → Open,
or strip the quarantine flag: `xattr -dr com.apple.quarantine "/Applications/Privacy First.app"`.
