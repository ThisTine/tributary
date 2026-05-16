use tauri::State;
use crate::{error::AppError, gitlab, model::{MergeRequest, TrackingRole}, state::AppState};

#[tauri::command]
pub async fn list_mrs(
    state: State<'_, AppState>,
    view: String,
    filter: Option<String>,
    search: Option<String>,
) -> Result<Vec<MergeRequest>, AppError> {
    let (token, instance, user_id) = auth_triple(&state).await;
    let (token, instance, user_id) = match (token, user_id) {
        (Some(t), Some(uid)) => (t, instance, uid),
        _ => return Ok(vec![]),
    };

    log::debug!("list_mrs view={view} user_id={user_id}");

    let gl = gitlab::GitLabClient::new(&instance, &token);
    let uid = user_id.to_string();

    let authored_params  = [("author_id",   uid.as_str())];
    let reviewer_params  = [("reviewer_id", uid.as_str())];
    let assignee_params  = [("assignee_id", uid.as_str())];

    let (authored, reviewing, assigned) = tokio::try_join!(
        gl.list_merge_requests(&authored_params),
        gl.list_merge_requests(&reviewer_params),
        gl.list_merge_requests(&assignee_params),
    )?;

    let mut seen = std::collections::HashSet::new();
    let mut mrs: Vec<MergeRequest> = Vec::new();

    for (gl_mrs, role) in [
        (authored,  TrackingRole::Author),
        (reviewing, TrackingRole::Reviewer),
        (assigned,  TrackingRole::Assignee),
    ] {
        for gl_mr in gl_mrs {
            if seen.insert(gl_mr.iid) {
                mrs.push(gitlab::map_mr(gl_mr, role.clone()));
            }
        }
    }

    // Apply optional search
    if let Some(q) = search.as_deref().filter(|s| !s.trim().is_empty()) {
        let q = q.to_lowercase();
        mrs.retain(|m| {
            m.title.to_lowercase().contains(&q)
                || m.project_path.to_lowercase().contains(&q)
                || m.author.username.to_lowercase().contains(&q)
                || m.iid.to_string().contains(&q)
                || m.labels.iter().any(|l| l.to_lowercase().contains(&q))
        });
    }

    Ok(mrs)
}

#[tauri::command]
pub async fn get_mr(
    state: State<'_, AppState>,
    iid: i64,
) -> Result<Option<MergeRequest>, AppError> {
    log::debug!("get_mr iid={iid}");
    Ok(None) // TODO: look up from cache
}

#[tauri::command]
pub async fn toggle_mute(
    _state: State<'_, AppState>,
    iid: i64,
) -> Result<bool, AppError> {
    log::debug!("toggle_mute iid={iid}");
    Ok(false)
}

#[tauri::command]
pub async fn unsubscribe_mr(
    _state: State<'_, AppState>,
    iid: i64,
) -> Result<(), AppError> {
    log::debug!("unsubscribe_mr iid={iid}");
    Ok(())
}

#[tauri::command]
pub async fn add_subscription_link(
    state: State<'_, AppState>,
    url: String,
) -> Result<MergeRequest, AppError> {
    let (token, _instance, user_id) = auth_triple(&state).await;
    let token = token.ok_or_else(|| AppError::Auth("Not authenticated".into()))?;

    // Parse: https://gitlab.com/group/project/-/merge_requests/123
    const SEP: &str = "/-/merge_requests/";
    let sep_pos = url.find(SEP)
        .ok_or_else(|| AppError::Other("Not a GitLab MR URL (expected /-/merge_requests/)".into()))?;

    // IID: everything after SEP, before any query/fragment
    let iid: i64 = url[sep_pos + SEP.len()..]
        .split(|c: char| !c.is_ascii_digit())
        .next().unwrap_or("")
        .parse()
        .map_err(|_| AppError::Other("Could not parse MR number from URL".into()))?;

    // Project path: strip scheme+host from the part before SEP
    let before_sep = &url[..sep_pos];                          // "https://gitlab.com/group/project"
    let no_scheme  = before_sep
        .trim_start_matches("https://")
        .trim_start_matches("http://");                        // "gitlab.com/group/project"
    let project_path = no_scheme
        .splitn(2, '/')
        .nth(1)
        .unwrap_or("")
        .trim_matches('/');                                    // "group/project"

    if project_path.is_empty() || iid == 0 {
        return Err(AppError::Other("Could not parse project path or MR IID from URL".into()));
    }

    // Re-derive instance from the URL's host (supports self-hosted GitLab)
    let scheme = if url.starts_with("http://") { "http" } else { "https" };
    let host   = no_scheme.split('/').next().unwrap_or("gitlab.com");
    let instance = format!("{scheme}://{host}");

    log::debug!("add_subscription_link instance={instance} project={project_path} iid={iid}");

    let gl    = gitlab::GitLabClient::new(&instance, &token);
    let gl_mr = gl.get_merge_request(project_path, iid).await?;

    let role = if Some(gl_mr.author.id) == user_id {
        TrackingRole::Author
    } else if gl_mr.reviewers.iter().any(|r| Some(r.id) == user_id) {
        TrackingRole::Reviewer
    } else if gl_mr.assignees.iter().any(|a| Some(a.id) == user_id) {
        TrackingRole::Assignee
    } else {
        TrackingRole::Reviewer
    };

    Ok(gitlab::map_mr(gl_mr, role))
}

#[tauri::command]
pub async fn search_projects(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<gitlab::GlProject>, AppError> {
    let (token, instance, _user_id) = auth_triple(&state).await;
    let (token, instance) = match token {
        Some(t) => (t, instance),
        None => return Ok(vec![]),
    };
    let gl = gitlab::GitLabClient::new(&instance, &token);
    gl.search_projects(&query).await
}

#[tauri::command]
pub async fn trigger_poll(_state: State<'_, AppState>) -> Result<(), AppError> {
    log::debug!("trigger_poll");
    Ok(())
}

#[tauri::command]
pub async fn open_in_gitlab(
    _state: State<'_, AppState>,
    iid: i64,
) -> Result<(), AppError> {
    log::debug!("open_in_gitlab iid={iid}");
    Ok(())
}

#[tauri::command]
pub async fn get_view_counts(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, AppError> {
    // Quick count: fetch all MRs and count by role
    let mrs = list_mrs(state, "inbox".into(), None, None).await?;
    Ok(serde_json::json!({
        "inbox":    mrs.iter().filter(|m| !m.muted).count(),
        "activity": 0,
        "reviews":  mrs.iter().filter(|m| matches!(m.role, TrackingRole::Reviewer)).count(),
        "assigned": mrs.iter().filter(|m| matches!(m.role, TrackingRole::Assignee)).count(),
        "authored": mrs.iter().filter(|m| matches!(m.role, TrackingRole::Author)).count(),
        "muted":    mrs.iter().filter(|m| m.muted).count(),
    }))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async fn auth_triple(state: &State<'_, AppState>) -> (Option<String>, String, Option<i64>) {
    let token   = state.token.read().await.clone();
    let instance = state.settings.read().await.instance.clone();
    let user_id  = state.current_user.read().await.as_ref().map(|u| u.id);
    (token, instance, user_id)
}
