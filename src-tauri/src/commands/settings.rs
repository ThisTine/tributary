use tauri::{AppHandle, State};
use crate::{error::AppError, model::Settings, state::AppState};

// macOS-specific path; avoids needing the AppHandle at pre-setup time.
pub fn settings_file_path() -> std::path::PathBuf {
    let home = std::env::var("HOME").unwrap_or_default();
    std::path::PathBuf::from(home)
        .join("Library/Application Support/dev.tributary.app/settings.json")
}

pub fn load_from_disk() -> Settings {
    let path = settings_file_path();
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

pub fn save_to_disk(settings: &Settings) {
    let path = settings_file_path();
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    if let Ok(json) = serde_json::to_string_pretty(settings) {
        let _ = std::fs::write(&path, json);
    }
}

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> Result<Settings, AppError> {
    let s = state.settings.read().await;
    Ok(s.clone())
}

#[tauri::command]
pub async fn set_settings(
    _app: AppHandle,
    state: State<'_, AppState>,
    patch: serde_json::Value,
) -> Result<Settings, AppError> {
    let mut s = state.settings.write().await;
    let mut current = serde_json::to_value(&*s)?;
    if let (Some(obj), Some(patch_obj)) = (current.as_object_mut(), patch.as_object()) {
        for (k, v) in patch_obj {
            obj.insert(k.clone(), v.clone());
        }
    }
    *s = serde_json::from_value(current)?;
    save_to_disk(&s);
    Ok(s.clone())
}
