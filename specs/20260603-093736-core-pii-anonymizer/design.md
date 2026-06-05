---
feature: core-pii-anonymizer
status: planned
created: 2026-06-03
decisions:
  - 20260603-0937-gui-framework
  - 20260603-0938-model-selection
  - 20260603-0938-sidecar-comms
  - 20260603-0938-output-format
  - 20260603-0938-gui-layout
---

# privacy-first v1 Design

## Overview

A cross-platform (Windows + macOS) desktop application that redacts PII from documents and raw text, entirely offline. The user drops in a file or pastes text, the app runs the `openai/privacy-filter` model locally, and returns a redacted version with colored highlights and a list of everything that was removed. No data leaves the machine.

---

## User Stories

### Story 1 — Redact a text file (P1)

A user has a `.txt` document containing PII. They open the app, drag the file onto the input area, click Process, and receive `document_redacted.txt` in the same folder with all PII replaced by typed labels (`[private_person]`, `[private_email]`, etc.). The in-app preview shows the redacted text with color-coded labels, and the PII panel lists every detected item with its type and original value.

**Why P1**: Core product value. Everything else is built on top of this flow.

**Independent test**: App processes `sample.txt`, produces `sample_redacted.txt`, preview shows colored labels, PII panel is populated.

**Acceptance scenarios**:
1. **Given** a `.txt` file with names and emails, **When** user drops it and clicks Process, **Then** `file_redacted.txt` is created with typed label replacements
2. **Given** a processed document, **When** user views the preview, **Then** each redacted span is visually distinct with a color per category
3. **Given** a processed document, **When** user views the PII panel, **Then** each entry shows `[TYPE]: original value`

---

### Story 2 — Paste and redact raw text (P1)

A user pastes a block of text directly into the input field (no file). They click Process. The redacted version appears in the preview and can be copied to clipboard. No file is written unless the user explicitly saves.

**Why P1**: Covers the quick-use case without file I/O — equally core to Story 1.

**Independent test**: User pastes text, processes, copies redacted output from preview.

**Acceptance scenarios**:
1. **Given** text pasted into the input field, **When** user clicks Process, **Then** preview shows redacted text with colored labels
2. **Given** a processed text paste, **When** user clicks Copy, **Then** clipboard contains the redacted plain text

---

### Story 3 — Redact a PDF or Word document (P2)

A user provides a `.pdf` or `.docx` file. The app extracts the text, runs redaction, and saves `document_redacted.txt` (plain text output). The original file is never modified.

**Why P2**: High demand, but adds parsing complexity. Plain text output is acceptable for v1 — preserving original PDF/DOCX formatting is v2.

**Independent test**: App accepts a PDF/DOCX, produces a plain text redacted output.

**Acceptance scenarios**:
1. **Given** a `.pdf` file, **When** user processes it, **Then** text is extracted and a `_redacted.txt` is produced
2. **Given** a `.docx` file, **When** user processes it, **Then** same flow as PDF
3. **Given** a password-protected PDF, **When** user processes it, **Then** app shows a warning and does not crash

---

### Story 4 — First-run model setup wizard (P1)

On first launch the model is not yet downloaded. The app shows a setup wizard explaining what will be downloaded (~3-6 GB from HuggingFace), shows a progress bar, and verifies the download on completion. After setup, the wizard closes and the main window opens.

**Why P1**: Nothing works without the model. Must be seamless.

**Independent test**: Fresh install (no model files present) shows wizard; wizard completes and model is usable.

**Acceptance scenarios**:
1. **Given** no model files present, **When** app launches, **Then** setup wizard is shown before main window
2. **Given** wizard is open, **When** user clicks Download, **Then** progress bar updates and wizard closes on completion
3. **Given** download is interrupted, **When** app relaunches, **Then** wizard resumes or restarts cleanly
4. **Given** model already downloaded, **When** app launches, **Then** wizard is skipped entirely

---

### Story 5 — Custom output location (P2)

By default the redacted file is saved next to the input file as `filename_redacted.txt`. The user can change the output folder via a folder picker before processing.

**Acceptance scenarios**:
1. **Given** no custom output set, **When** processing completes, **Then** `_redacted.txt` appears next to the source file
2. **Given** user selects a custom folder, **When** processing completes, **Then** file is saved there instead

---

### Edge Cases

- Input file is empty → show "No content to process" warning, do nothing
- Input text/file contains no detectable PII → show "No PII detected" in PII panel, output equals input
- File is too large for model context (>128K tokens) → split into chunks, process sequentially, recombine
- PDF has no extractable text (scanned image) → show warning "Scanned PDF not supported in v1"
- Model inference fails (OOM, corrupt model files) → show error with actionable message, do not crash
- User closes app mid-processing → sidecar process is killed cleanly, no partial file written

---

## Requirements

### Functional Requirements

- **FR-001**: App MUST run on Windows 10+ and macOS 12+
- **FR-002**: App MUST process all files locally; no network calls during redaction
- **FR-003**: App MUST accept `.txt`, `.pdf`, `.docx` files and raw pasted text as input
- **FR-004**: App MUST support file selection via picker and drag & drop
- **FR-005**: App MUST replace detected PII with typed labels: `[private_person]`, `[private_email]`, `[private_phone]`, `[private_address]`, `[private_date]`, `[private_url]`, `[private_account]`, `[private_secret]`
- **FR-006**: App MUST display a preview of redacted text with color-coded labels per PII category
- **FR-007**: App MUST display a PII panel listing each detected item as `TYPE: original value`
- **FR-008**: App MUST save output as `[filename]_redacted.txt` next to the source by default
- **FR-009**: User MUST be able to select an alternative output folder
- **FR-010**: App MUST show a first-run wizard to download the `openai/privacy-filter` model from HuggingFace
- **FR-011**: Model files MUST be stored next to the app binary
- **FR-012**: App MUST handle files exceeding 128K tokens by chunking

### Key Entities

- **Document**: User-provided input. Has a source path (or null for paste), raw text, and parsed text.
- **RedactionResult**: Output of model inference. Contains redacted text and a list of `PiiSpan` items.
- **PiiSpan**: A single detected PII item. Has `start`, `end`, `label` (category), and `original_value`.
- **ModelConfig**: Tracks model download state and local path.

---

## Components

### Tauri Shell (Rust)
Manages the app window, file system dialogs, drag & drop events, and sidecar process lifecycle. Exposes Tauri commands consumed by the frontend.

### React Frontend (TypeScript)
All UI: setup wizard, main window, input area, preview panel, PII list panel, output location selector. Communicates with Tauri shell via `invoke()`.

### Python Sidecar
Handles all heavy lifting:
- File parsing: `PyMuPDF` for PDFs, `python-docx` for Word, stdlib for plain text
- Model inference via `opf` (openai/privacy-filter Python package)
- Chunking for long documents
- Communication via stdin/stdout JSON-RPC

### IPC Protocol (stdin/stdout JSON-RPC)
Messages from frontend → sidecar:
```json
{ "id": 1, "method": "redact", "params": { "text": "...", "source": "paste|file" } }
{ "id": 2, "method": "status" }
```
Responses from sidecar → frontend:
```json
{ "id": 1, "result": { "redacted_text": "...", "spans": [...] } }
{ "id": 1, "error": { "code": -1, "message": "..." } }
```

---

## GUI Layout

```
┌─────────────────────────────────────────────────────┐
│  privacy-first                                      │
├──────────────────────────┬──────────────────────────┤
│  INPUT                   │  PREVIEW (redacted)      │
│  ┌────────────────────┐  │  Call [private_person]   │
│  │ Drop file here or  │  │  at [private_email]      │
│  │ paste text below   │  │  ···                     │
│  └────────────────────┘  │                          │
│  [Choose File]           │                          │
│                          │                          │
│  Output: [same folder ▾] │                          │
│  [Process]               │                          │
├──────────────────────────┴──────────────────────────┤
│  DETECTED PII                                       │
│  private_person: John Smith                         │
│  private_email: john@example.com                    │
│  private_phone: +31 6 12345678                      │
│  [Copy redacted text]  [Save file]                  │
└─────────────────────────────────────────────────────┘
```

---

## Open Questions

- Which React UI library to use? (shadcn/ui, Mantine, or bare Tailwind)
- Should the PII panel show confidence scores from the model?
- For chunked documents, should the PII list show which chunk each item came from?
- Should the setup wizard support offline install from a local model folder?

---

## Success Criteria

- **SC-001**: User can redact a 10-page Word document end-to-end in under 60 seconds on a modern CPU
- **SC-002**: First-run setup completes without errors on both Windows and macOS
- **SC-003**: No PII from processed documents is written to disk anywhere other than the designated output file
- **SC-004**: App handles an empty or PII-free input without crashing
