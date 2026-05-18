use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub initials: String,
    pub color: String,
}

impl User {
    pub fn initials_from_name(name: &str) -> String {
        let parts: Vec<&str> = name.split_whitespace().collect();
        match parts.len() {
            0 => "?".into(),
            1 => parts[0].chars().next().map(|c| c.to_uppercase().to_string()).unwrap_or_default(),
            _ => {
                let first = parts[0].chars().next().unwrap_or('?');
                let last  = parts[parts.len() - 1].chars().next().unwrap_or('?');
                format!("{}{}", first.to_uppercase(), last.to_uppercase())
            }
        }
    }

    /// Stable deterministic color from username hash.
    pub fn color_from_username(username: &str) -> String {
        const PALETTE: &[&str] = &[
            "#7c5cff", "#ff6b9d", "#4cc9f0", "#b07cff",
            "#ffb84c", "#4cd089", "#ff8a4c", "#2f80ed",
        ];
        let idx = username.bytes().fold(0usize, |acc, b| acc.wrapping_add(b as usize)) % PALETTE.len();
        PALETTE[idx].to_string()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PipelineStatus {
    Success,
    Failed,
    Running,
    Manual,
    Canceled,
}

impl Default for PipelineStatus {
    fn default() -> Self { PipelineStatus::Canceled }
}

impl std::fmt::Display for PipelineStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            PipelineStatus::Success  => "success",
            PipelineStatus::Failed   => "failed",
            PipelineStatus::Running  => "running",
            PipelineStatus::Manual   => "manual",
            PipelineStatus::Canceled => "canceled",
        };
        write!(f, "{s}")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TrackingRole {
    Author,
    Reviewer,
    Assignee,
    Label,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MRActivity {
    pub who: User,
    pub what: String,
    pub time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeRequest {
    pub iid: i64,
    pub project_path: String,
    pub project_color: String,
    pub title: String,
    pub author: User,
    pub role: TrackingRole,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label_match: Option<String>,
    pub draft: bool,
    pub conflicts: bool,
    pub pipeline: String,
    pub pipeline_detail: String,
    pub approvals: u32,
    pub approvals_required: u32,
    pub unresolved_threads: i64,
    pub resolved_threads: i64,
    pub reviewers: Vec<User>,
    pub labels: Vec<String>,
    pub additions: u32,
    pub deletions: u32,
    pub branch: String,
    pub updated_at: String,
    pub updated_relative: String,
    pub muted: bool,
    pub web_url: String,
    pub activity: Vec<MRActivity>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub etag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventKind {
    PipelineFailed,
    PipelinePassed,
    ReviewRequested,
    ChangesRequested,
    Approved,
    Commented,
    Pushed,
    Mentioned,
    Conflict,
    Merged,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventBucket {
    Today,
    Yesterday,
    Earlier,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub mr_iid: i64,
    pub mr_project: String,
    pub mr_title: String,
    pub kind: String,
    pub who: Option<User>,
    pub body: String,
    pub time_relative: String,
    pub timestamp: String,
    pub bucket: String,
    pub unread: bool,
    pub web_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub pipeline_failed: bool,
    pub review_requested: bool,
    pub mentioned: bool,
    pub approved: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSettings {
    pub wallpaper: String,
    pub accent: String,
    pub density: String,
    pub glass_strength: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceSettings {
    pub launch_at_login: bool,
    pub close_to_tray: bool,
    pub reduce_motion: bool,
    pub auto_update: bool,
    pub theme: ThemeSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub instance: String,
    pub token_present: bool,
    pub poll_interval_minutes: u32,
    pub notifications: NotificationSettings,
    pub workspace: WorkspaceSettings,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            instance: "https://gitlab.com".into(),
            token_present: false,
            poll_interval_minutes: 5,
            notifications: NotificationSettings {
                pipeline_failed: true,
                review_requested: true,
                mentioned: true,
                approved: false,
            },
            workspace: WorkspaceSettings {
                launch_at_login: true,
                close_to_tray: true,
                reduce_motion: false,
                auto_update: true,
                theme: ThemeSettings {
                    wallpaper: "dusk".into(),
                    accent: "#5b6cff".into(),
                    density: "regular".into(),
                    glass_strength: 0.55,
                },
            },
        }
    }
}

// ── Subscription rules ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rule {
    pub id: String,
    pub kind: String, // "link" | "role" | "label"
    pub payload: serde_json::Value,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResult {
    pub ok: bool,
    pub user: Option<User>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PollerState {
    Idle,
    Polling,
    Offline,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollerStatus {
    pub state: PollerState,
    pub message: Option<String>,
}
