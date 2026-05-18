use tauri::{AppHandle, Emitter, State};
use crate::{commands::settings, error::AppError, model::{AuthResult, User}, state::AppState};

#[tauri::command]
pub async fn get_current_user(state: State<'_, AppState>) -> Result<Option<User>, AppError> {
    Ok(state.current_user.read().await.clone())
}

const KEYCHAIN_SERVICE: &str = "tributary";
const KEYCHAIN_ACCOUNT: &str = "token";

/// Validates the token against GET /user, stores it in the keychain, and
/// caches the authenticated user in AppState.
#[tauri::command]
pub async fn set_token(
    state: State<'_, AppState>,
    token: String,
) -> Result<AuthResult, AppError> {
    let instance = state.settings.read().await.instance.clone();

    let user_json = validate_token(&instance, &token).await?;

    match user_json {
        None => Ok(AuthResult { ok: false, user: None, error: Some("Token rejected by GitLab".into()) }),
        Some((_user, false)) => Ok(AuthResult { ok: false, user: None, error: Some("GitLab rejected the token".into()) }),
        Some((user_val, _)) => {
            let username = user_val["username"].as_str().unwrap_or("").to_string();
            let name     = user_val["name"].as_str().unwrap_or(&username).to_string();
            let id       = user_val["id"].as_i64().unwrap_or(0);

            // Store in OS keychain keyed by instance
            let account = format!("{instance}:{KEYCHAIN_ACCOUNT}");
            let entry = keyring::Entry::new(KEYCHAIN_SERVICE, &account)
                .map_err(|e| AppError::Keychain(e.to_string()))?;
            entry.set_password(&token)
                .map_err(|e| AppError::Keychain(e.to_string()))?;

            let color    = crate::model::User::color_from_username(&username);
            let initials = crate::model::User::initials_from_name(&name);
            let user = crate::model::User { id, username, name, avatar_url: None, initials, color };

            *state.token.write().await = Some(token);
            *state.current_user.write().await = Some(user.clone());
            {
                let mut s = state.settings.write().await;
                s.token_present = true;
                settings::save_to_disk(&s);
            }

            Ok(AuthResult { ok: true, user: Some(user), error: None })
        }
    }
}

/// Called at startup — loads the stored token, re-validates it against GitLab,
/// restores the authenticated user into AppState, and emits "auth-ready".
pub async fn load_token_from_keychain(app: &AppHandle, state: &AppState) -> bool {
    let instance = state.settings.read().await.instance.clone();
    let account  = format!("{instance}:{KEYCHAIN_ACCOUNT}");

    let Ok(entry) = keyring::Entry::new(KEYCHAIN_SERVICE, &account) else { return false };
    let Ok(token) = entry.get_password() else { return false };

    match fetch_user(&instance, &token).await {
        Some(user) => {
            *state.token.write().await = Some(token);
            *state.current_user.write().await = Some(user.clone());
            state.settings.write().await.token_present = true;
            let _ = app.emit("auth-ready", user);
            true
        }
        None => false,
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async fn fetch_user(instance: &str, token: &str) -> Option<crate::model::User> {
    let client = reqwest::Client::new();
    let resp = client.get(format!("{instance}/api/v4/user"))
        .header("PRIVATE-TOKEN", token)
        .send().await.ok()?;
    if !resp.status().is_success() { return None; }
    let json: serde_json::Value = resp.json().await.ok()?;
    let username = json["username"].as_str().unwrap_or("").to_string();
    let name     = json["name"].as_str().unwrap_or(&username).to_string();
    let id       = json["id"].as_i64().unwrap_or(0);
    let color    = crate::model::User::color_from_username(&username);
    let initials = crate::model::User::initials_from_name(&name);
    Some(crate::model::User { id, username, name, avatar_url: None, initials, color })
}

async fn validate_token(
    instance: &str,
    token: &str,
) -> Result<Option<(serde_json::Value, bool)>, AppError> {
    let client = reqwest::Client::new();
    let resp = client.get(format!("{instance}/api/v4/user"))
        .header("PRIVATE-TOKEN", token)
        .send().await?;
    let ok = resp.status().is_success();
    let json: serde_json::Value = resp.json().await?;
    Ok(Some((json, ok)))
}
