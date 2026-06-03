import { invoke } from "@tauri-apps/api/core";
import type { ModelStatus, ParseResult, RedactionResult } from "./ipc";

/**
 * Typed wrappers over Tauri invoke() for all sidecar commands.
 * Command name strings must match #[tauri::command] names in src-tauri/src/lib.rs.
 * Errors propagate as thrown strings (Tauri's default error serialization).
 */
export const sidecar = {
  ping(): Promise<string> {
    return invoke<string>("ping");
  },

  modelStatus(): Promise<ModelStatus> {
    return invoke<ModelStatus>("model_status");
  },

  /** Download the openai/privacy-filter model to the binary directory. */
  downloadModel(): Promise<void> {
    return invoke<void>("download_model");
  },

  /**
   * Redact PII from a plain-text string.
   * For files, call parseFile first, then pass the extracted text here.
   */
  redact(text: string): Promise<RedactionResult> {
    return invoke<RedactionResult>("redact", { text });
  },

  /** Extract plain text from a .txt, .pdf, or .docx file path. */
  parseFile(path: string): Promise<ParseResult> {
    return invoke<ParseResult>("parse_file", { path });
  },

  /** Write redacted output to disk. Returns the absolute path written. */
  saveOutput(text: string, sourcePath: string, outputDir: string | null): Promise<string> {
    return invoke<string>("save_output", { text, sourcePath, outputDir });
  },
};
