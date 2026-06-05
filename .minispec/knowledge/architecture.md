# Architecture

## Overview

privacy-first is a Tauri desktop application with three layers:

```
┌─────────────────────────────────────────────┐
│  React Frontend (TypeScript)                │
│  UI: wizard, main window, preview, PII panel│
└────────────────┬────────────────────────────┘
                 │ Tauri invoke() commands
┌────────────────▼────────────────────────────┐
│  Tauri Shell (Rust)                         │
│  Window mgmt, file system, drag & drop,     │
│  sidecar lifecycle                          │
└────────────────┬────────────────────────────┘
                 │ stdin/stdout JSON-RPC
┌────────────────▼────────────────────────────┐
│  Python Sidecar                             │
│  File parsing (PyMuPDF, python-docx),       │
│  model inference (openai/privacy-filter),   │
│  chunking for long documents                │
└─────────────────────────────────────────────┘
```

## Key Design Constraints

- **Strictly local**: No network calls during redaction. Model downloaded once on first run.
- **Model storage**: `openai/privacy-filter` weights stored next to the app binary.
- **IPC**: Tauri ↔ Python communicates via stdin/stdout JSON-RPC (no local HTTP port).

## Decisions

See `.minispec/knowledge/decisions/` for all architectural decision records:

- `20260603-0937-gui-framework.md` — Why Tauri
- `20260603-0938-model-selection.md` — Why openai/privacy-filter
- `20260603-0938-sidecar-comms.md` — Why stdin/stdout over HTTP
- `20260603-0938-output-format.md` — Typed label format
- `20260603-0938-gui-layout.md` — Three-area GUI layout
