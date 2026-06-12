# Privacy First

A privacy-preserving desktop application for detecting, reviewing, and redacting **Personally Identifiable Information (PII)** from documents.

Privacy First uses the [OpenAI Privacy Filter](https://github.com/openai/privacy-filter) model to automatically identify sensitive data (names, emails, phone numbers, addresses, ID numbers, URLs, dates, organizations, and account numbers) in your files, giving you full control to decide what gets redacted before saving.

---

## Features

✅ **Multi-format support** — PDF, DOCX, and plain text files  
✅ **AI-powered PII detection** — OpenAI's privacy-filter transformer model  
✅ **Fine-grained control** — Toggle redaction per span or per category  
✅ **Visual preview** — See detected PII highlighted inline with color-coded categories  
✅ **Batch review** — Group PII by type, review and adjust with one click  
✅ **Privacy-first processing** — All processing happens locally; no data leaves your device  
✅ **Cross-platform** — macOS, Windows, Linux (built with [Tauri](https://tauri.app))  

---

## System Requirements

| Component | Requirement | Purpose |
|-----------|-------------|---------|
| Rust + Cargo | stable | Tauri app shell |
| Node.js | ≥20 | Frontend build |
| Python | 3.11–3.14 | ML sidecar |
| Memory | ≥4 GB | AI model (~2.6 GB) |

**First run:** The AI model downloads on first use (~2.6 GB). Subsequent runs use the cached model.

---

## Quick Start

### 1. Install Dependencies

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js (if not already installed)
# https://nodejs.org/ — version ≥20 recommended

# Clone and enter the repo
git clone https://github.com/yourusername/privacy-first.git
cd privacy-first
```

### 2. Set Up Python Environment

```bash
python3 -m venv sidecar/.venv
sidecar/.venv/bin/pip install -e "sidecar[dev]"
```

**On Windows:**
```bat
python -m venv sidecar\.venv
sidecar\.venv\Scripts\pip install -e "sidecar[dev]"
```

### 3. Build the Python Sidecar

```bash
# macOS / Linux
bash sidecar/build.sh

# Windows
sidecar\build.bat
```

### 4. Install Frontend Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run tauri dev
```

The app will launch in a native window. The model downloads on first run (~2 min).

---

## Usage

1. **Drop a file** — Drag and drop a PDF, DOCX, or TXT file into the app, or use the file picker
2. **Review detected PII** — Click "Verwerken" to analyze the document
   - View highlighted spans in the center panel
   - See grouped PII categories on the right
3. **Adjust redactions** — Toggle individual spans or entire categories to keep/redact
4. **Save** — Click "Sla op" to save the redacted file to your chosen directory

---

## Building for Production

```bash
npm run tauri build
```

**Output:**
- **macOS:** `src-tauri/target/release/bundle/dmg/*.dmg`
- **Windows:** `src-tauri/target/release/bundle/msi/*.msi`

For code signing and notarization on macOS/Windows, see [BUILD.md](BUILD.md#code-signing).

---

## Architecture

Privacy First is built in three layers:

```
┌─────────────────────────────────────┐
│  Frontend (React + TypeScript)      │
│  Mantine UI components              │
└─────────────┬───────────────────────┘
              │
              ↓ JSON-RPC over stdin/stdout
              
┌─────────────────────────────────────┐
│  Tauri Shell (Rust)                 │
│  Sidecar process management         │
└─────────────┬───────────────────────┘
              │
              ↓
              
┌─────────────────────────────────────┐
│  Python Sidecar                     │
│  • OpenAI Privacy Filter model      │
│  • PDF/DOCX/TXT parsing & redaction │
│  • PyMuPDF for PDF handling         │
└─────────────────────────────────────┘
```

**Key Design Principles:**
- **Minimal Rust layer** — The shell just spawns the sidecar and manages the window
- **Local processing** — All ML inference and file I/O happens on your machine
- **Reactive UI** — React state in `MainWindow.tsx` flows down to components

For detailed architecture, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## PII Categories

The model detects and labels these categories:

| Label | Example |
|-------|---------|
| `private_person` | John Doe |
| `private_email` | john@example.com |
| `private_phone` | +31-6-12345678 |
| `private_address` | 123 Main St, New York |
| `private_id` | 123-45-6789 (SSN, etc.) |
| `private_url` | https://example.com |
| `private_date` | 12/25/2024 |
| `private_organization` | Acme Corp |
| `account_number` | 1234567890 |

Each category has a distinct color for easy visual identification.

---

## Development

### Project Structure

```
privacy-first/
├── src/                    Frontend (React/TypeScript)
├── sidecar/                Python ML/redaction engine
├── src-tauri/              Tauri shell (Rust)
├── docs/                   Architecture & guides
├── .github/workflows/      CI/CD pipelines
└── BUILD.md                Detailed build instructions
```

### Running Tests

```bash
# Frontend type checking
npm run build

# Python sidecar tests (if available)
cd sidecar
python -m pytest
```

### Common Issues

**"sidecar terminated unexpectedly"** — The Python binary is missing. Re-run `sidecar/build.sh` and verify the binary exists in `src-tauri/binaries/`.

**"PyMuPDF not found"** — Run:
```bash
sidecar/.venv/bin/pip install pymupdf
```

See [BUILD.md#troubleshooting](BUILD.md#troubleshooting) for more help.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes and test locally
4. Push to your fork
5. Open a pull request

---

## License

[Add your license here — e.g., MIT, Apache 2.0, etc.]

---

## Acknowledgments

- [OpenAI Privacy Filter](https://github.com/openai/privacy-filter) — The core ML model
- [Tauri](https://tauri.app) — Cross-platform app framework
- [Mantine](https://mantine.dev) — React component library
- [PyMuPDF](https://pymupdf.readthedocs.io) — PDF manipulation

---

## Questions?

- 📖 See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical deep-dives
- 🔧 See [BUILD.md](BUILD.md) for build troubleshooting
- 💬 Open an [issue](https://github.com/yourusername/privacy-first/issues) on GitHub
