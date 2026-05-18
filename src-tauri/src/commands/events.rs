use tauri::{AppHandle, State};
use crate::{error::AppError, gitlab, model::Event, state::AppState, tray};

#[tauri::command]
pub async fn list_events(
    app: AppHandle,
    state: State<'_, AppState>,
    filter: Option<String>,
) -> Result<Vec<Event>, AppError> {
    let token = state.token.read().await.clone();
    let Some(token) = token else { return Ok(vec![]) };
    let instance = state.settings.read().await.instance.clone();

    log::debug!("list_events filter={filter:?}");

    let gl = gitlab::GitLabClient::new(&instance, &token);
    let todos = gl.list_todos().await?;
    let events: Vec<Event> = todos.into_iter().map(gitlab::map_todo).collect();

    // Cache for tray and mark-all-read
    {
        let mut cache = state.events_cache.write().await;
        *cache = events.clone();
    }
    tray::refresh_tray(&app);

    Ok(events)
}

#[tauri::command]
pub async fn mark_events_read(
    app: AppHandle,
    state: State<'_, AppState>,
    ids: Option<Vec<String>>,
) -> Result<(), AppError> {
    log::debug!("mark_events_read ids={ids:?}");

    // Update local cache immediately for instant UI feedback
    {
        let mut cache = state.events_cache.write().await;
        match &ids {
            Some(id_list) => {
                for e in cache.iter_mut() {
                    if id_list.contains(&e.id) { e.unread = false; }
                }
            }
            None => {
                for e in cache.iter_mut() { e.unread = false; }
            }
        }
    }
    tray::refresh_tray(&app);

    // Persist to GitLab so the todos stay read after reload
    let token = state.token.read().await.clone();
    let instance = state.settings.read().await.instance.clone();
    if let Some(token) = token {
        let gl = gitlab::GitLabClient::new(&instance, &token);
        match &ids {
            None => { let _ = gl.mark_all_todos_done().await; }
            Some(id_list) => {
                for event_id in id_list {
                    if let Some(id_str) = event_id.strip_prefix("todo-") {
                        if let Ok(id) = id_str.parse::<i64>() {
                            let _ = gl.mark_todo_done(id).await;
                        }
                    }
                }
            }
        }
    }

    Ok(())
}
