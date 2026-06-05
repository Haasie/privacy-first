# privacy-first Constitution

## Core Principles

### I. Privacy by Design
All data processing happens exclusively on the local machine. No data — input text, filenames, logs, usage metrics, or any derivative — may be transmitted to external services. No telemetry. No cloud APIs. This is non-negotiable and applies to all dependencies as well; any library that phones home must not be included.

### II. PII Completeness
The tool must detect and redact all PII categories covered by the OpenAI privacy filter model (names, emails, phone numbers, addresses, SSNs, IBANs, credit card numbers, dates of birth, and similar). Detection accuracy should balance false positives and false negatives equally — missed PII is as problematic as over-redacting safe content. When new PII categories are identified, they should be added.

### III. Graceful Degradation
When processing fails — bad input, unknown formats, model errors — the tool returns partial results accompanied by clear, actionable warnings. The user is always informed about what was and was not processed. Silent failures are forbidden.

### IV. Cross-Platform Reliability
The GUI must work on both Windows and macOS without hacks or platform-specific branches. Prefer established cross-platform frameworks (e.g. Electron, Tauri, or similar) over lightweight alternatives, even at the cost of bundle size.

### V. Targeted Testing
Write tests for business logic and edge cases: PII detection accuracy, redaction correctness, input/output contract, and error handling paths. No coverage percentage targets. Do not write tests for trivial wiring or UI layout.

---

## Technology Stack

- **Processing**: Local models only (based on OpenAI privacy filter model approach)
- **GUI**: Cross-platform framework (Electron / Tauri — TBD during design phase)
- **Language**: TypeScript or Python — TBD; prefer whatever best supports the chosen local model
- **Dependencies**: Minimize where possible; all must be auditable and local-only

---

## MiniSpec Preferences

### Review Chunk Size
large — 80-150 lines per chunk. Move fast, trust the engineer to catch issues at review.

### Documentation Review Policy
trust-ai — AI handles all documentation autonomously. Engineer reviews in git if needed.

### Autonomy Level
tests-passing — AI proceeds automatically when tests pass; pauses on test failure or ambiguity.

### Design Evolution Handling
always-discuss — AI stops implementation to discuss any design deviation, however minor. Spec integrity is preferred over velocity.

### Walkthrough Depth
standard — Architecture + key patterns + conventions (15-20 min).

### Complexity Tolerance
- **Change size**: Thorough — proper fix with tests and error handling by default
- **Abstraction threshold**: Conservative — extract only when duplicated 3+ times or exceeds 50 lines
- **Review findings**: Triage first — discuss before fixing medium-severity findings
- **Deletion permission**: Yes — propose removing unnecessary code during any task

---

## Governance

This constitution supersedes all other practices. MiniSpec preferences may be adjusted per-feature by mutual agreement. Amendments that change a principle require explicit discussion; preference changes can be made inline.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02
