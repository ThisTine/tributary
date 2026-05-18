use std::sync::Arc;
use tokio::sync::RwLock;
use crate::model::{Event, Rule, Settings, User};

#[derive(Clone)]
pub struct AppState {
    pub settings: Arc<RwLock<Settings>>,
    pub token: Arc<RwLock<Option<String>>>,
    pub current_user: Arc<RwLock<Option<User>>>,
    pub events_cache: Arc<RwLock<Vec<Event>>>,
    pub rules: Arc<RwLock<Vec<Rule>>>,
}

impl AppState {
    pub fn new(settings: Settings, rules: Vec<Rule>) -> Self {
        Self {
            settings: Arc::new(RwLock::new(settings)),
            token: Arc::new(RwLock::new(None)),
            current_user: Arc::new(RwLock::new(None)),
            events_cache: Arc::new(RwLock::new(Vec::new())),
            rules: Arc::new(RwLock::new(rules)),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new(Settings::default(), Vec::new())
    }
}
