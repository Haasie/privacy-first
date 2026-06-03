/** A single detected PII span within the redacted text. */
export interface PiiSpan {
  /** Byte offset where the span starts in the original text. */
  start: number;
  /** Byte offset where the span ends in the original text. */
  end: number;
  /** PII category label, e.g. "private_person", "private_email". */
  label: string;
  /** The original text that was redacted. */
  original_value: string;
}

/** Result returned by the `redact` sidecar command. */
export interface RedactionResult {
  /** Full text with PII replaced by typed labels. */
  redacted_text: string;
  /** All detected PII spans, in document order. */
  spans: PiiSpan[];
}

/** Result returned by the `model_status` sidecar command. */
export interface ModelStatus {
  /** Whether the model weights are present and loadable. */
  ready: boolean;
  /** Absolute path to the model directory. */
  path: string;
  /** Model version string, or empty string if not yet downloaded. */
  version: string;
}

/** Result returned by the `parse_file` sidecar command. */
export interface ParseResult {
  /** Extracted plain text from the file. */
  text: string;
  /** Non-fatal warning, e.g. scanned PDF detected. */
  warning?: string;
}

/** Download progress event emitted during model download. */
export interface DownloadProgress {
  /** Bytes downloaded so far. */
  downloaded: number;
  /** Total bytes to download, or -1 if unknown. */
  total: number;
}
