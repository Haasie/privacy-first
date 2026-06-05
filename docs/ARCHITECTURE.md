# Architecture

## Overview

Privacy First is a desktop application built on [Tauri v2](https://tauri.app). It wraps the [OpenAI Privacy Filter](https://github.com/openai/privacy-filter) model in a native GUI that lets users detect, review, and redact PII from documents.

```
┌─────────────────────────────────────────────────────────┐
│  Tauri shell (Rust)                                     │
│  ┌─────────────────────┐    ┌──────────────────────┐   │
│  │  Frontend           │    │  Sidecar (Python)    │   │
│  │  React + TypeScript │◄──►│  stdin/stdout IPC    │   │
│  │  Mantine UI         │    │  opf model           │   │
│  └─────────────────────┘    │  PyMuPDF redaction   │   │
│                              └──────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Components

### Tauri shell (`src-tauri/`)

The Rust layer is minimal. It:
- Spawns the Python sidecar process on startup
- Exposes `invoke` commands to the frontend that forward JSON-RPC calls to the sidecar over stdin/stdout
- Manages the application window (title, size, dark mode handled via frontend)

Key files:
- `src/lib.rs` — registers plugins (shell, dialog, fs) and sidecar state
- `src/commands.rs` — Tauri `#[command]` functions: `parse_file`, `redact`, `save_redacted_file`, `download_model`, `check_model`

### Frontend (`src/`)

Single-page React app. State lives entirely in `MainWindow.tsx` and flows down as props — no external state manager.

```
MainWindow (state owner)
├── InputArea          — file picker, output dir, process/save actions
├── PreviewPanel       — annotated document text with clickable PII spans
└── PiiPanel           — grouped PII list with per-category and per-span toggles
```

UI library: [Mantine v7](https://mantine.dev). Icons: [@tabler/icons-react](https://tabler-icons.io).

Key state in `MainWindow`:
| State | Type | Purpose |
|-------|------|---------|
| `result` | `RedactionResult \| null` | Raw sidecar output |
| `keptSpans` | `Set<number>` | Individual spans the user wants to preserve |
| `hiddenLabels` | `Set<string>` | Categories toggled off (all spans treated as kept) |
| `highlightedSpan` | `number \| null` | Triggers scroll+flash in PreviewPanel |
| `savedPath` | `string \| null` | Path of last saved file |

### Python sidecar (`sidecar/`)

A long-running process that reads newline-delimited JSON from stdin and writes responses to stdout. The Rust shell communicates with it exclusively via this pipe.

```
sidecar_main.py     — entry point, starts the read loop
ipc.py              — JSON-RPC dispatcher (@ipc.register decorator)
model.py            — model loading, download, check
redactor.py         — text redaction + PDF/DOCX output
parser.py           — file parsing (PDF text extraction, DOCX, TXT)
```

**IPC protocol:**

Request (stdin):
```json
{"method": "redact", "params": {"text": "..."}, "id": 1}
```

Response (stdout):
```json
{"id": 1, "result": {"spans": [...], "redacted_text": "..."}}
```

Available methods: `check_model`, `download_model`, `parse_file`, `redact`, `save_redacted_file`.

### AI model

Model: `openai/privacy-filter` from Hugging Face. It is a small transformer trained to detect PII spans in text. It labels spans with categories: `private_person`, `private_email`, `private_phone`, `private_address`, `private_id`, `private_url`, `private_date`, `private_organization`, `account_number`.

The model uses its own config format (not the standard HuggingFace format). Key detail: `config.json` must contain `encoding` (tiktoken name) and `bidirectional_context` fields. The `model.safetensors` file uses opf's own tensor layout, not the HF layout — so the `original/` directory files must be promoted to the model root.

Model is stored at:
- **Dev:** `target/debug/models/openai-privacy-filter/`
- **Production:** `<app-binary-dir>/models/openai-privacy-filter/`

### PDF redaction (`sidecar/redactor.py`)

Uses [PyMuPDF](https://pymupdf.readthedocs.io) (`fitz`). For each detected span:
1. Split the span value on newlines (multi-line addresses)
2. `page.search_for(part)` finds bounding rectangles on the page
3. `page.add_redact_annot(rect, text=placeholder, fill=color)` draws a colored block with a label
4. `page.apply_redactions()` burns the annotations in

Each PII category has its own fill/text color pair (defined in `_LABEL_STYLE`). The same colors are used in the frontend via `categoryColors.ts`.

## Data flow

```
User drops file
  → parse_file (sidecar): extract text from PDF/DOCX/TXT
  → text displayed in InputArea (char count)
  
User clicks "Verwerken"
  → redact (sidecar): run opf model on text
  → result: { spans: [{label, start, end, original_value}], redacted_text }
  → PreviewPanel: render text with highlighted spans
  → PiiPanel: group spans by label
  
User adjusts spans (toggle keep/redact per span or per category)
  → keptSpans / hiddenLabels updated in MainWindow state
  → PreviewPanel and PiiPanel re-render reactively
  
User clicks "Sla op"
  → save_redacted_file (sidecar): rebuild PDF/DOCX/TXT with only non-kept spans redacted
  → savedPath shown with "Open map" link
```

## Directory structure

```
privacy-first/
├── src/                    Frontend (React/TypeScript)
│   ├── components/
│   │   ├── MainWindow.tsx  Layout + state
│   │   ├── InputArea.tsx   Left column
│   │   ├── PreviewPanel.tsx  Centre column
│   │   ├── PiiPanel.tsx    Right column
│   │   └── ErrorBanner.tsx
│   ├── hooks/
│   │   └── useFileInput.ts  Drag-and-drop + file dialog
│   └── lib/
│       ├── categoryColors.ts  Label → color mapping + Dutch names
│       ├── ipc.ts            TypeScript types
│       └── sidecar.ts        Frontend sidecar client
├── sidecar/                Python sidecar
│   ├── sidecar_main.py
│   ├── ipc.py
│   ├── model.py
│   ├── redactor.py
│   ├── parser.py
│   ├── requirements.txt
│   └── build.sh
├── src-tauri/              Rust shell
│   ├── src/
│   │   ├── lib.rs
│   │   └── commands.rs
│   ├── icons/              App icons (all sizes)
│   └── tauri.conf.json
├── docs/                   This documentation
├── .github/workflows/      CI/CD
└── app-icon.svg            Master icon source
```
