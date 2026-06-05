---
id: 20260603-0938-model-selection
title: PII Model — openai/privacy-filter
status: accepted
date: 2026-06-03
---

## Decision

Use the **openai/privacy-filter** model from HuggingFace as the sole PII detection backend.

## Context

The project specifically targets this model. It covers 8 PII categories (person, email, phone, address, date, URL, account number, secret) using a 1.5B parameter bidirectional token classifier with 50M active parameters. It runs fully locally on CPU or GPU with a 128K token context window.

## Choice

`openai/privacy-filter` via the `opf` Python CLI/library.

## Consequences

- Model is ~3-6 GB and must be downloaded on first run
- Model files stored next to the app binary for portability
- Output uses the tool's native "typed" mode: `[private_person]`, `[private_email]`, etc.
- Documents exceeding 128K tokens must be chunked before inference
