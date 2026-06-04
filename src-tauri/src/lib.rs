mod commands;

use commands::Sidecar;
use tauri_plugin_shell::ShellExt;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let (rx, child) = app.shell().sidecar("sidecar")?.spawn()?;
            app.manage(Sidecar::new(child, rx));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::model_status,
            commands::download_model,
            commands::redact,
            commands::parse_file,
            commands::save_output,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
