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
            // Store the model under the OS user-data dir, not next to the
            // sidecar binary (which lives inside the signed .app bundle).
            // Writing into the bundle would need admin rights in /Applications
            // and would invalidate the code signature ("app is damaged").
            let model_dir = app
                .path()
                .app_data_dir()
                .expect("app data dir unavailable")
                .join("models")
                .join("openai-privacy-filter");
            if let Err(e) = std::fs::create_dir_all(&model_dir) {
                eprintln!("[setup] could not create model dir {model_dir:?}: {e}");
            }

            let spawn = app
                .shell()
                .sidecar("sidecar")
                .and_then(|s| s.args(["--model-dir", &model_dir.to_string_lossy()]).spawn());
            let sidecar = match spawn {
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
