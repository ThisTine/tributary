use std::path::PathBuf;
use tauri::State;
use crate::{error::AppError, model::Rule, state::AppState};

fn rules_file_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_default();
    PathBuf::from(home)
        .join("Library/Application Support/dev.tributary.app/rules.json")
}

pub fn load_from_disk() -> Vec<Rule> {
    std::fs::read_to_string(rules_file_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_to_disk(rules: &[Rule]) {
    let path = rules_file_path();
    if let Some(dir) = path.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    if let Ok(json) = serde_json::to_string_pretty(rules) {
        let _ = std::fs::write(path, json);
    }
}

#[tauri::command]
pub async fn list_rules(state: State<'_, AppState>) -> Result<Vec<Rule>, AppError> {
    Ok(state.rules.read().await.clone())
}

#[tauri::command]
pub async fn save_rule(state: State<'_, AppState>, rule: Rule) -> Result<Rule, AppError> {
    let mut rules = state.rules.write().await;
    if let Some(existing) = rules.iter_mut().find(|r| r.id == rule.id) {
        *existing = rule.clone();
    } else {
        rules.push(rule.clone());
    }
    save_to_disk(&rules);
    Ok(rule)
}

#[tauri::command]
pub async fn delete_rule(state: State<'_, AppState>, id: String) -> Result<(), AppError> {
    let mut rules = state.rules.write().await;
    rules.retain(|r| r.id != id);
    save_to_disk(&rules);
    Ok(())
}
