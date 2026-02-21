use tauri::Manager;

mod printing;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            printing::print_invoice,
            printing::print_thermal,
            printing::get_printers,
            printing::print_raw,
        ])
        .setup(|app| {
            // Focus main window on launch
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running LookKool Studio");
}
