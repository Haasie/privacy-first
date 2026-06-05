use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use serde_json::{json, Value};
use tauri::State;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tokio::sync::{Mutex, mpsc};

static NEXT_ID: AtomicU64 = AtomicU64::new(1);

struct Inner {
    child: CommandChild,
    rx: mpsc::Receiver<CommandEvent>,
}

pub struct Sidecar(Mutex<Option<Inner>>);

impl Sidecar {
    pub fn new(child: CommandChild, rx: mpsc::Receiver<CommandEvent>) -> Self {
        Self(Mutex::new(Some(Inner { child, rx })))
    }

    pub fn unavailable() -> Self {
        Self(Mutex::new(None))
    }

    async fn call(&self, method: &str, params: Value) -> Result<Value, String> {
        let id = NEXT_ID.fetch_add(1, Ordering::Relaxed);
        let req =
            serde_json::to_string(&json!({ "id": id, "method": method, "params": params }))
                .map_err(|e| e.to_string())?
                + "\n";

        let mut g = self.0.lock().await;
        let inner = g.as_mut().ok_or_else(|| {
            "Sidecar not available — build it first with: bash sidecar/build.sh".to_string()
        })?;
        inner.child.write(req.as_bytes()).map_err(|e| e.to_string())?;

        loop {
            match inner.rx.recv().await {
                Some(CommandEvent::Stdout(bytes)) => {
                    let line = String::from_utf8_lossy(&bytes);
                    if let Ok(resp) = serde_json::from_str::<Value>(&line) {
                        if resp.get("id").and_then(|v| v.as_u64()) == Some(id) {
                            return if let Some(err) = resp.get("error") {
                                Err(err["message"]
                                    .as_str()
                                    .unwrap_or("sidecar error")
                                    .to_string())
                            } else {
                                Ok(resp["result"].clone())
                            };
                        }
                    }
                }
                Some(CommandEvent::Stderr(bytes)) => {
                    eprintln!("[sidecar] {}", String::from_utf8_lossy(&bytes));
                }
                Some(CommandEvent::Error(e)) => {
                    return Err(format!("sidecar error: {e}"));
                }
                Some(CommandEvent::Terminated(_)) | None => {
                    return Err("sidecar terminated unexpectedly".to_string());
                }
                Some(_) => {}
            }
        }
    }
}

// ── Sidecar pass-through commands ─────────────────────────────────────────────

#[tauri::command]
pub async fn ping(sidecar: State<'_, Sidecar>) -> Result<String, String> {
    sidecar
        .call("ping", json!({}))
        .await
        .and_then(|v| v.as_str().map(str::to_owned).ok_or("unexpected response".into()))
}

#[tauri::command]
pub async fn model_status(sidecar: State<'_, Sidecar>) -> Result<Value, String> {
    sidecar.call("model_status", json!({})).await
}

#[tauri::command]
pub async fn download_model(sidecar: State<'_, Sidecar>) -> Result<(), String> {
    sidecar.call("download_model", json!({})).await.map(|_| ())
}

#[tauri::command]
pub async fn redact(sidecar: State<'_, Sidecar>, text: String) -> Result<Value, String> {
    sidecar.call("redact", json!({ "text": text })).await
}

#[tauri::command]
pub async fn parse_file(sidecar: State<'_, Sidecar>, path: String) -> Result<Value, String> {
    sidecar.call("parse_file", json!({ "path": path })).await
}

#[tauri::command]
pub async fn save_redacted_file(
    sidecar: State<'_, Sidecar>,
    source_path: String,
    spans: Value,
    redacted_text: String,
    output_dir: Option<String>,
) -> Result<Value, String> {
    sidecar
        .call(
            "save_redacted_file",
            json!({
                "source_path": source_path,
                "spans": spans,
                "redacted_text": redacted_text,
                "output_dir": output_dir,
            }),
        )
        .await
}

// ── Native file I/O ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn save_output(
    text: String,
    source_path: String,
    output_dir: Option<String>,
) -> Result<String, String> {
    let stem = if source_path.is_empty() {
        "document".to_string()
    } else {
        Path::new(&source_path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("document")
            .to_string()
    };

    let dir = match output_dir {
        Some(d) => PathBuf::from(d),
        None if !source_path.is_empty() => Path::new(&source_path)
            .parent()
            .map(|p| p.to_path_buf())
            .unwrap_or_else(|| PathBuf::from(".")),
        None => PathBuf::from("."),
    };

    let out_path = dir.join(format!("{stem}_redacted.txt"));
    std::fs::write(&out_path, text.as_bytes()).map_err(|e| e.to_string())?;
    Ok(out_path.to_string_lossy().into_owned())
}
