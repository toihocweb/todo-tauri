
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_notification::NotificationExt;
use crate::types::TimerState;

pub async fn run_timer_countdown(app_handle: AppHandle, timer_arc: Arc<Mutex<TimerState>>) {
    loop {
        tokio::time::sleep(Duration::from_secs(1)).await;
        
        let should_continue = {
            let mut timer = timer_arc.lock().unwrap();
            
            // Check if timer is paused or stopped
            if !timer.is_active || timer.is_paused || !timer.is_running {
                break;
            }
            
            if timer.remaining_seconds > 0 {
                timer.remaining_seconds -= 1;
                true
            } else {
                timer.is_running = false;
                timer.is_active = false;
                false
            }
        };
        
        if !should_continue {
            let todo_title = {
                let timer = timer_arc.lock().unwrap();
                timer.todo_title.clone()
            };
            
            let _ = app_handle
                .notification()
                .builder()
                .title("Timer Completed!")
                .body(&format!("Time's up for: {}", todo_title))
                .show();
            
            let _ = app_handle.emit("timer-finished", ());
            
            if let Some(timer_window) = app_handle.get_webview_window("timer") {
                let _ = timer_window.close();
            }
            if let Some(main_window) = app_handle.get_webview_window("main") {
                let _ = main_window.show();
                let _ = main_window.set_focus();
            }
            break;
        } else {
            // Update timer display
            let timer_data = {
                let timer = timer_arc.lock().unwrap();
                timer.clone()
            };
            let _ = app_handle.emit_to("timer", "timer-update", &timer_data);
            println!("Timer: {} seconds remaining", timer_data.remaining_seconds);
        }
    }
}
