---
feature: core-pii-anonymizer
status: planned
created: 2026-06-03
chunk_size: large
total_tasks: 14
estimated_lines: 1350
---

# privacy-first v1 — Task Breakdown

## Overview

Implements the full privacy-first desktop app: Tauri shell + React/TS frontend + Python sidecar communicating via stdin/stdout JSON-RPC. Covers project scaffolding, Python model inference pipeline, file parsing, frontend GUI (wizard + main window + panels), Tauri command wiring, error handling, and cross-platform build config.

---

## Task List

### Foundation

#### Task 1: Project scaffolding
- **Estimate:** ~120 lines
- **Files:** `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src/main.tsx`, `sidecar/pyproject.toml`, `sidecar/__main__.py`, `.gitignore`, `package.json`
- **Description:** Initialize the Tauri app with React/TypeScript frontend. Create the Python sidecar project structure (`sidecar/` directory) with a placeholder entry point. Configure Tauri to bundle the sidecar binary. Set up build tooling (pnpm/npm, Python venv).
- **Depends on:** None
- **Acceptance:** `pnpm tauri dev` launches an empty Tauri window without errors
- **Evidence:** App window opens, no build errors in console

#### Task 2: Python sidecar IPC skeleton
- **Estimate:** ~100 lines
- **Parallel:** Can run with Task 3
- **Files:** `sidecar/ipc.py`, `sidecar/__main__.py`, `sidecar/tests/test_ipc.py`
- **Description:** Implement the stdin/stdout JSON-RPC server. Reads newline-delimited JSON from stdin, dispatches to registered handlers, writes responses to stdout. Includes a `ping` command, error envelope (`{ "id": N, "error": { "code": N, "message": "..." } }`), and graceful shutdown on EOF. Tests verify round-trip for ping and malformed input handling.
- **Depends on:** Task 1
- **Acceptance:** `echo '{"id":1,"method":"ping","params":{}}' | python -m sidecar` returns `{"id":1,"result":"pong"}`
- **Evidence:** `pytest sidecar/tests/test_ipc.py` passes

#### Task 3: TypeScript IPC types + invoke wrapper
- **Estimate:** ~80 lines
- **Parallel:** Can run with Task 2
- **Files:** `src/lib/ipc.ts`, `src/lib/sidecar.ts`
- **Description:** Define TypeScript types for all JSON-RPC request/response messages (`RedactRequest`, `RedactResponse`, `PiiSpan`, `StatusResponse`, etc.). Implement a typed `invoke()` wrapper that calls the Python sidecar via Tauri's sidecar API and handles error envelopes uniformly.
- **Depends on:** Task 1
- **Acceptance:** TypeScript compiles with no errors; types cover all protocol messages from the design
- **Evidence:** `pnpm tsc --noEmit` passes

---

### Python Sidecar Core

#### Task 4: Model loader
- **Estimate:** ~100 lines
- **Files:** `sidecar/model.py`, `sidecar/tests/test_model.py`
- **Description:** Detect the `openai/privacy-filter` model at the expected path (next to the app binary). Expose a `status` IPC command returning `{ "ready": bool, "path": str, "version": str }`. Expose a `download` command that fetches the model from HuggingFace with progress events streamed back to the frontend. Tests verify path detection and status reporting with a mock model directory.
- **Depends on:** Task 2
- **Acceptance:** `status` returns `ready: false` when model absent, `ready: true` after download
- **Evidence:** `pytest sidecar/tests/test_model.py` passes

#### Task 5: Core redaction command
- **Estimate:** ~130 lines
- **Parallel:** Can run with Tasks 6, 7
- **Files:** `sidecar/redactor.py`, `sidecar/tests/test_redactor.py`
- **Description:** Wrap the `opf` Python library with `--output-mode typed`. Parse the model's output into a `RedactionResult` containing `redacted_text` (str) and `spans` (list of `PiiSpan` with `start`, `end`, `label`, `original_value`). Expose a `redact` IPC command accepting `{ "text": str }`. Tests cover: text with multiple PII types, text with no PII (returns unchanged), empty string input.
- **Depends on:** Task 4
- **Acceptance:** `redact` on "Call John at john@example.com" returns spans for `private_person` and `private_email`
- **Evidence:** `pytest sidecar/tests/test_redactor.py` passes (requires model present)

#### Task 6: File parser
- **Estimate:** ~120 lines
- **Parallel:** Can run with Tasks 5, 7
- **Files:** `sidecar/parser.py`, `sidecar/tests/test_parser.py`
- **Description:** Accept a file path and return extracted plain text. Dispatch by extension: `.txt` via stdlib, `.pdf` via PyMuPDF (`fitz`), `.docx` via `python-docx`. Expose a `parse_file` IPC command. Tests cover: valid .txt, valid .pdf, valid .docx, non-existent file, password-protected PDF (error, not crash), scanned-image PDF (empty text + warning).
- **Depends on:** Task 2
- **Acceptance:** All three file types parse to plain text; edge cases return structured errors
- **Evidence:** `pytest sidecar/tests/test_parser.py` passes

#### Task 7: Chunking
- **Estimate:** ~90 lines
- **Parallel:** Can run with Tasks 5, 6
- **Files:** `sidecar/chunker.py`, `sidecar/tests/test_chunker.py`
- **Description:** Split text exceeding 128K tokens into overlapping chunks (configurable overlap to avoid mid-sentence splits). After per-chunk redaction, merge results and re-index `PiiSpan` offsets to the full document. Tests cover: short text (no split), exact boundary, long text requiring N chunks, offset correctness after merge.
- **Depends on:** Task 2
- **Acceptance:** A 200K-token document produces correct merged spans with no offset errors
- **Evidence:** `pytest sidecar/tests/test_chunker.py` passes

---

### Frontend

#### Task 8: Setup wizard
- **Estimate:** ~130 lines
- **Files:** `src/components/SetupWizard.tsx`, `src/hooks/useModelStatus.ts`
- **Description:** On app launch, call the `status` IPC command. If model not ready, show the setup wizard: explanation of what will be downloaded, estimated size, a Download button. While downloading, show a progress bar fed by streamed progress events from the sidecar. On completion, dismiss wizard and show main window. If model already present, skip wizard entirely.
- **Depends on:** Tasks 3, 4
- **Acceptance:** Fresh run (no model) shows wizard; wizard completes and main window appears; subsequent runs skip wizard
- **Evidence:** Manual test on both Windows and macOS

#### Task 9: Main window + input area
- **Estimate:** ~120 lines
- **Parallel:** Can run with Tasks 10, 11
- **Files:** `src/components/MainWindow.tsx`, `src/components/InputArea.tsx`, `src/hooks/useFileInput.ts`
- **Description:** Three-area layout (input top-left, preview top-right, PII panel bottom). Input area: drag & drop zone (Tauri file drop event), "Choose File" button (Tauri open dialog), text paste textarea. Output folder selector (defaults to same as input, allows folder picker override). Process button triggers redaction via IPC, disabled during processing.
- **Depends on:** Tasks 3, 8
- **Acceptance:** File drag, file pick, and text paste all populate the input; Process button calls IPC
- **Evidence:** Manual test for each input method

#### Task 10: Preview panel
- **Estimate:** ~100 lines
- **Parallel:** Can run with Tasks 9, 11
- **Files:** `src/components/PreviewPanel.tsx`, `src/lib/categoryColors.ts`
- **Description:** Render redacted text with color-coded inline labels. Each `PiiSpan` label maps to a distinct color (8 categories = 8 colors in `categoryColors.ts`). Spans rendered as colored elements with a tooltip showing category name. "No content yet" placeholder before processing; "No PII detected" when spans array is empty.
- **Depends on:** Task 3
- **Acceptance:** Preview renders all 8 label types with distinct colors; tooltip shows category on hover
- **Evidence:** Manual test with a document containing all 8 PII types

#### Task 11: PII list panel
- **Estimate:** ~80 lines
- **Parallel:** Can run with Tasks 9, 10
- **Files:** `src/components/PiiPanel.tsx`
- **Description:** Scrollable list of all detected PII entries, each showing `[LABEL]: original_value`, grouped by category. "Copy redacted text" button copies plain redacted text to clipboard. "Save file" button triggers file save via Tauri. Empty state and "No PII detected" state handled.
- **Depends on:** Task 3
- **Acceptance:** Panel renders grouped list; copy and save buttons work
- **Evidence:** Manual test; clipboard contains correct plain text after copy

---

### Integration

#### Task 12: Tauri commands + file I/O
- **Estimate:** ~110 lines
- **Files:** `src-tauri/src/commands.rs`, `src-tauri/src/main.rs`
- **Description:** Implement Rust `#[tauri::command]` handlers: `open_file_dialog`, `save_file_dialog`, `write_output_file` (writes `filename_redacted.txt`), `open_folder_dialog`. Wire drag & drop file events to frontend. Register all commands in `tauri::Builder`. Ensure sidecar spawns on app start and is killed cleanly on exit.
- **Depends on:** Tasks 1, 9
- **Acceptance:** File open/save dialogs work; `filename_redacted.txt` written correctly; no orphan sidecar processes after app close
- **Evidence:** Manual test; verify process list after closing app

#### Task 13: Error handling + edge cases
- **Estimate:** ~90 lines
- **Files:** `src/components/ErrorBanner.tsx`, `sidecar/errors.py`, updates to `sidecar/redactor.py`, `sidecar/parser.py`
- **Description:** Wire all error paths end-to-end. Frontend `ErrorBanner` shows actionable messages per error code. Sidecar defines error codes for: empty input, no PII found (status, not error), scanned PDF, model OOM, parse failure. Verify graceful degradation: partial results returned when possible, never a silent failure or unhandled crash.
- **Depends on:** Tasks 5, 6, 9
- **Acceptance:** All edge cases from the design doc produce a visible message, not a crash or silent failure
- **Evidence:** Manual test of each edge case: empty input, PII-free doc, scanned PDF, model OOM simulation

#### Task 14: Cross-platform build config
- **Estimate:** ~80 lines
- **Files:** `src-tauri/tauri.conf.json`, `sidecar/build.sh`, `sidecar/build.bat`, `BUILD.md`
- **Description:** Configure Tauri to produce signed app bundles for Windows (.msi) and macOS (.dmg). Configure PyInstaller to produce a single-file sidecar binary for each platform. Ensure the sidecar binary and model directory are bundled correctly relative to the app binary. Document build steps in `BUILD.md`.
- **Depends on:** Tasks 12, 13
- **Acceptance:** `pnpm tauri build` produces runnable binaries on both platforms; app launches and processes a document end-to-end
- **Evidence:** End-to-end smoke test on Windows and macOS

---

## Notes

- **UI library:** Mantine (`@mantine/core` + `@mantine/hooks`). Decision recorded in `20260603-0940-ui-library.md`.
- Tasks 5, 6, 7 all depend on the sidecar IPC skeleton (Task 2) but are otherwise independent of each other.
- Tasks 9, 10, 11 share IPC types from Task 3 but don't block each other.
- Task 14 is deliberately last — build config is easier once the feature is stable.
- **Deferred to v2:** Output preserving original PDF/DOCX format, batch processing, settings toggle for generic vs. typed labels, offline model install from local folder, confidence scores in PII panel.

---

## Progress

- [x] Task 1: Project scaffolding
- [x] Task 2: Python sidecar IPC skeleton
- [x] Task 3: TypeScript IPC types + invoke wrapper
- [x] Task 4: Model loader
- [x] Task 5: Core redaction command
- [x] Task 6: File parser
- [x] Task 7: Chunking
- [x] Task 8: Setup wizard
- [x] Task 9: Main window + input area
- [x] Task 10: Preview panel
- [x] Task 11: PII list panel
- [x] Task 12: Tauri commands + file I/O
- [x] Task 13: Error handling + edge cases
- [x] Task 14: Cross-platform build config
