#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let clerk_pk = option_env!("CLERK_PUBLISHABLE_KEY")
        .unwrap_or("pk_test_Z3JhbmQtbWFudGlzLTc5LmNsZXJrLmFjY291bnRzLmRldiQ");

    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_clerk::ClerkPluginBuilder::new()
                .publishable_key(clerk_pk)
                .with_tauri_store()
                .build(),
        )
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
