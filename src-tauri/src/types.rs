
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct TimerState {
    pub is_running: bool,
    pub is_active: bool,
    pub is_paused: bool,
    pub remaining_seconds: u64,
    pub original_seconds: u64,
    pub todo_title: String,
    pub todo_id: String,
}

#[derive(Default)]
pub struct AppTimerState {
    pub timer: Arc<Mutex<TimerState>>,
}
