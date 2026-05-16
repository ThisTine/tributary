use tauri::{Manager, RunEvent};
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

mod commands;
pub mod error;
pub mod gitlab;
pub mod model;
pub mod state;
mod tray;

use commands::{auth, events, mrs, settings};
use state::AppState;

pub fn run() {
    env_logger::init();

    // Load persisted settings before constructing AppState so the correct
    // instance URL is available when we attempt keychain lookup at startup.
    let saved_settings = settings::load_from_disk();
    let app_state = AppState::new(saved_settings);

    tauri::Builder::default()
        .manage(app_state)
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            tray::setup_tray(app)?;

            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "macos")]
                apply_vibrancy(&window, NSVisualEffectMaterial::Sidebar, None, Some(14.0))
                    .expect("Failed to apply vibrancy");
            }

            let state: tauri::State<AppState> = app.state();
            let state_clone = state.inner().clone();
            tauri::async_runtime::spawn(async move {
                auth::load_token_from_keychain(&state_clone).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            auth::set_token,
            settings::get_settings,
            settings::set_settings,
            mrs::list_mrs,
            mrs::get_mr,
            mrs::toggle_mute,
            mrs::unsubscribe_mr,
            mrs::add_subscription_link,
            mrs::search_projects,
            mrs::trigger_poll,
            mrs::open_in_gitlab,
            mrs::get_view_counts,
            events::list_events,
            events::mark_events_read,
        ])
        .build(tauri::generate_context!())
        .expect("error building Tauri application")
        .run(|_app, event| {
            // Only prevent exit when triggered by window close (code is None).
            // Programmatic exits like app.exit(0) carry Some(code) and must go through.
            if let RunEvent::ExitRequested { code, api, .. } = event {
                if code.is_none() {
                    api.prevent_exit();
                }
            }
        });
}
