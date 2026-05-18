use chrono::{DateTime, Utc};
use reqwest::Client;
use serde::Deserialize;

use crate::{error::AppError, model};

// ── Client ────────────────────────────────────────────────────────────────────

pub struct GitLabClient {
    client: Client,
    base_url: String,
    token: String,
}

impl GitLabClient {
    pub fn new(base_url: &str, token: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.trim_end_matches('/').to_string(),
            token: token.to_string(),
        }
    }

    fn url(&self, path: &str) -> String {
        format!("{}/api/v4{}", self.base_url, path)
    }

    async fn get<T: serde::de::DeserializeOwned>(&self, url: &str) -> Result<T, AppError> {
        let resp = self.client.get(url)
            .header("PRIVATE-TOKEN", &self.token)
            .send()
            .await?;
        if !resp.status().is_success() {
            return Err(AppError::Gitlab(format!("HTTP {}", resp.status())));
        }
        Ok(resp.json::<T>().await?)
    }

    pub async fn current_user(&self) -> Result<GlUser, AppError> {
        self.get(&self.url("/user")).await
    }

    pub async fn list_merge_requests(
        &self,
        extra: &[(&str, &str)],
    ) -> Result<Vec<GlMr>, AppError> {
        let mut url = reqwest::Url::parse(&self.url("/merge_requests"))
            .map_err(|e| AppError::Other(e.to_string()))?;
        {
            let mut q = url.query_pairs_mut();
            q.append_pair("state", "opened");
            q.append_pair("per_page", "100");
            q.append_pair("with_merge_status_recheck", "false");
            for (k, v) in extra {
                q.append_pair(k, v);
            }
        }
        self.get(url.as_str()).await
    }

    pub async fn list_todos(&self) -> Result<Vec<GlTodo>, AppError> {
        let url = format!("{}?per_page=100&type=MergeRequest", self.url("/todos"));
        self.get(&url).await
    }

    pub async fn get_merge_request(
        &self,
        project_path: &str,
        iid: i64,
    ) -> Result<GlMr, AppError> {
        let encoded = project_path.replace('/', "%2F");
        let url = self.url(&format!("/projects/{}/merge_requests/{}", encoded, iid));
        self.get(&url).await
    }

    pub async fn mark_todo_done(&self, todo_id: i64) -> Result<(), AppError> {
        let url = self.url(&format!("/todos/{}/mark_as_done", todo_id));
        let resp = self.client.post(&url)
            .header("PRIVATE-TOKEN", &self.token)
            .send().await?;
        if !resp.status().is_success() {
            return Err(AppError::Gitlab(format!("HTTP {}", resp.status())));
        }
        Ok(())
    }

    pub async fn mark_all_todos_done(&self) -> Result<(), AppError> {
        let url = self.url("/todos/mark_as_done");
        let resp = self.client.post(&url)
            .header("PRIVATE-TOKEN", &self.token)
            .send().await?;
        if !resp.status().is_success() {
            return Err(AppError::Gitlab(format!("HTTP {}", resp.status())));
        }
        Ok(())
    }

    pub async fn list_mrs_by_label(
        &self,
        project_path: &str,
        labels: &[String],
    ) -> Result<Vec<GlMr>, AppError> {
        let encoded = project_path.replace('/', "%2F");
        let mut url = reqwest::Url::parse(&self.url(&format!("/projects/{}/merge_requests", encoded)))
            .map_err(|e| AppError::Other(e.to_string()))?;
        {
            let mut q = url.query_pairs_mut();
            q.append_pair("state", "opened");
            q.append_pair("per_page", "100");
            q.append_pair("labels", &labels.join(","));
        }
        self.get(url.as_str()).await
    }

    pub async fn search_projects(&self, query: &str) -> Result<Vec<GlProject>, AppError> {
        let mut url = reqwest::Url::parse(&self.url("/projects"))
            .map_err(|e| AppError::Other(e.to_string()))?;
        {
            let mut q = url.query_pairs_mut();
            q.append_pair("membership", "true");
            q.append_pair("per_page", "20");
            q.append_pair("order_by", "last_activity_at");
            if !query.trim().is_empty() {
                q.append_pair("search", query.trim());
            }
        }
        self.get(url.as_str()).await
    }
}

// ── GitLab response types ─────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct GlUser {
    pub id: i64,
    pub username: String,
    pub name: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GlApprovedBy {
    pub user: GlUser,
}

#[derive(Debug, Deserialize)]
pub struct GlPipeline {
    pub status: String,
    pub id: i64,
}

#[derive(Debug, Deserialize)]
pub struct GlReferences {
    pub full: String,
}

#[derive(Debug, Deserialize)]
pub struct GlMr {
    pub iid: i64,
    pub title: String,
    pub author: GlUser,
    pub reviewers: Vec<GlUser>,
    pub assignees: Vec<GlUser>,
    pub labels: Vec<String>,
    #[serde(default)]
    pub draft: bool,
    #[serde(default)]
    pub work_in_progress: bool,
    pub has_conflicts: Option<bool>,
    pub web_url: String,
    pub source_branch: String,
    pub updated_at: String,
    pub head_pipeline: Option<GlPipeline>,
    pub project_id: i64,
    pub references: GlReferences,
    pub diff_refs: Option<serde_json::Value>,
    pub user_notes_count: Option<i64>,
    pub blocking_discussions_resolved: Option<bool>,
    pub approved_by: Option<Vec<GlApprovedBy>>,
}

#[derive(Debug, Deserialize, serde::Serialize)]
pub struct GlProject {
    pub id: i64,
    pub path_with_namespace: String,
    pub name_with_namespace: String,
    pub web_url: String,
}

#[derive(Debug, Deserialize)]
pub struct GlTodoProject {
    pub path_with_namespace: String,
}

#[derive(Debug, Deserialize)]
pub struct GlTodoTarget {
    pub iid: i64,
    pub title: String,
    pub web_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GlTodo {
    pub id: i64,
    pub project: GlTodoProject,
    pub author: Option<GlUser>,
    pub action_name: String,
    pub target_type: String,
    pub target: GlTodoTarget,
    pub target_url: Option<String>,
    pub body: Option<String>,
    pub state: String,
    pub created_at: String,
}

// ── Mappers ───────────────────────────────────────────────────────────────────

pub fn map_user(gl: &GlUser) -> model::User {
    model::User {
        id: gl.id,
        username: gl.username.clone(),
        name: gl.name.clone(),
        avatar_url: gl.avatar_url.clone(),
        initials: model::User::initials_from_name(&gl.name),
        color: model::User::color_from_username(&gl.username),
    }
}

pub fn map_mr(gl: GlMr, role: model::TrackingRole) -> model::MergeRequest {
    let project_path = gl.references.full
        .split('!')
        .next()
        .unwrap_or(&gl.references.full)
        .trim_end_matches('/')
        .to_string();

    let project_color = project_color(&project_path);
    let pipeline_str = gl.head_pipeline.as_ref()
        .map(|p| pipeline_status(&p.status))
        .unwrap_or("canceled")
        .to_string();
    let pipeline_detail = gl.head_pipeline.as_ref()
        .map(|p| format!("Pipeline · {}", p.status))
        .unwrap_or_else(|| "No pipeline".to_string());
    let updated_relative = relative_time(&gl.updated_at);

    model::MergeRequest {
        iid: gl.iid,
        project_path,
        project_color,
        title: gl.title,
        author: map_user(&gl.author),
        role,
        label_match: None,
        draft: gl.draft || gl.work_in_progress,
        conflicts: gl.has_conflicts.unwrap_or(false),
        pipeline: pipeline_str,
        pipeline_detail,
        approvals: gl.approved_by.as_ref().map(|v| v.len() as u32).unwrap_or(0),
        approvals_required: 1,
        unresolved_threads: if gl.blocking_discussions_resolved == Some(false) {
            gl.user_notes_count.unwrap_or(1)
        } else {
            0
        },
        resolved_threads: 0,
        reviewers: gl.reviewers.iter().map(map_user).collect(),
        labels: gl.labels,
        additions: 0,
        deletions: 0,
        branch: gl.source_branch,
        updated_at: gl.updated_at,
        updated_relative,
        muted: false,
        web_url: gl.web_url,
        activity: vec![],
        etag: None,
    }
}

pub fn map_todo(todo: GlTodo) -> model::Event {
    let now = Utc::now();
    let kind = match todo.action_name.as_str() {
        "build_failed"                            => "pipeline_failed",
        "review_requested" | "approval_required" => "review_requested",
        "mentioned" | "directly_addressed"       => "mentioned",
        "assigned"                               => "review_requested",
        "unmergeable"                            => "conflict",
        _                                        => "commented",
    };

    let created_dt = DateTime::parse_from_rfc3339(&todo.created_at)
        .map(|d| d.with_timezone(&Utc))
        .unwrap_or(now);
    let diff_days = (now.date_naive() - created_dt.date_naive()).num_days();
    let bucket = if diff_days == 0 { "today" } else if diff_days == 1 { "yesterday" } else { "earlier" };

    let mr_title = todo.target.title.clone();
    let web_url = todo.target_url
        .or(todo.target.web_url)
        .unwrap_or_default();

    model::Event {
        id: format!("todo-{}", todo.id),
        mr_iid: todo.target.iid,
        mr_project: todo.project.path_with_namespace,
        mr_title,
        kind: kind.to_string(),
        who: todo.author.as_ref().map(map_user),
        body: todo.body.unwrap_or_else(|| todo.target.title.clone()),
        time_relative: relative_time(&todo.created_at),
        timestamp: todo.created_at,
        bucket: bucket.to_string(),
        unread: todo.state == "pending",
        web_url,
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn pipeline_status(s: &str) -> &'static str {
    match s {
        "success" | "passed"                              => "success",
        "failed"                                          => "failed",
        "running" | "pending" | "preparing"
        | "waiting_for_resource" | "scheduled" | "created" => "running",
        "manual"                                          => "manual",
        _                                                 => "canceled",
    }
}

fn project_color(path: &str) -> String {
    const PALETTE: &[&str] = &[
        "#ff8a4c", "#b07cff", "#4cd089", "#ffb84c",
        "#4cc9f0", "#ff6b9d", "#7c5cff", "#2f80ed",
    ];
    let idx = path.bytes().fold(0usize, |acc, b| acc.wrapping_add(b as usize)) % PALETTE.len();
    PALETTE[idx].to_string()
}

pub fn relative_time(iso: &str) -> String {
    let Ok(dt) = DateTime::parse_from_rfc3339(iso) else { return "?".to_string() };
    let secs = Utc::now().signed_duration_since(dt.with_timezone(&Utc)).num_seconds();
    match secs {
        s if s < 60      => "just now".to_string(),
        s if s < 3_600   => format!("{}m", s / 60),
        s if s < 86_400  => format!("{}h", s / 3_600),
        s if s < 604_800 => format!("{}d", s / 86_400),
        s                => format!("{}w", s / 604_800),
    }
}
