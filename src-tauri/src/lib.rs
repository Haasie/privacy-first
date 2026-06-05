mod commands;

use commands::Sidecar;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let sidecar = match app.shell().sidecar("sidecar").and_then(|s| s.spawn()) {
                Ok((rx, child)) => Sidecar::new(child, rx),
                Err(e) => {
                    eprintln!("[setup] sidecar unavailable: {e}");
                    Sidecar::unavailable()
                }
            };
            app.manage(sidecar);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::model_status,
            commands::download_model,
            commands::redact,
            commands::parse_file,
            commands::save_output,
            commands::save_redacted_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
