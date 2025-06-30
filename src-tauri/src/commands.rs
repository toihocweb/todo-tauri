
use tauri::{AppHandle, Manager, State, Emitter};
use crate::types::{AppTimerState, TimerState};
use crate::timer::run_timer_countdown;
use crate::window::{create_timer_window, create_about_dialog};
use tauri_plugin_updater::UpdaterExt;

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub async fn start_timer(
    app_handle: AppHandle,
    todo_title: String,
    todo_id: String,
    duration_minutes: u64,
    timer_state: State<'_, AppTimerState>,
) -> Result<(), String> {
    let timer_arc = timer_state.timer.clone();
    
    {
        let mut timer = timer_arc.lock().unwrap();
        timer.is_running = true;
        timer.is_active = true;
        timer.is_paused = false;
        timer.remaining_seconds = duration_minutes * 60;
        timer.original_seconds = duration_minutes * 60;
        timer.todo_title = todo_title.clone();
        timer.todo_id = todo_id;
    }

    if let Some(main_window) = app_handle.get_webview_window("main") {
        let _ = main_window.hide();
    }

    create_timer_window(&app_handle).await?;
    
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        run_timer_countdown(app_handle_clone, timer_arc).await;
    });

    println!("Timer started for {} minutes", duration_minutes);
    Ok(())
}

#[tauri::command]
pub async fn stop_timer(
    app_handle: AppHandle,
    timer_state: State<'_, AppTimerState>,
) -> Result<(), String> {
    {
        let mut timer = timer_state.timer.lock().unwrap();
        timer.is_running = false;
        timer.is_active = false;
        timer.is_paused = false;
    }

    if let Some(timer_window) = app_handle.get_webview_window("timer") {
        let _ = timer_window.close();
    }
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }

    Ok(())
}

#[tauri::command]
pub async fn pause_timer(
    app_handle: AppHandle,
    timer_state: State<'_, AppTimerState>
) -> Result<(), String> {
    {
        let mut timer = timer_state.timer.lock().unwrap();
        timer.is_paused = true;
        timer.is_active = false;
    }
    
    let timer_data = {
        let timer = timer_state.timer.lock().unwrap();
        timer.clone()
    };
    let _ = app_handle.emit_to("timer", "timer-update", &timer_data);
    
    println!("Timer paused");
    Ok(())
}

#[tauri::command]
pub async fn resume_timer(
    app_handle: AppHandle,
    timer_state: State<'_, AppTimerState>
) -> Result<(), String> {
    let timer_arc = timer_state.timer.clone();
    
    {
        let mut timer = timer_arc.lock().unwrap();
        timer.is_paused = false;
        timer.is_active = true;
        timer.is_running = true;
    }
    
    let timer_data = {
        let timer = timer_arc.lock().unwrap();
        timer.clone()
    };
    let _ = app_handle.emit_to("timer", "timer-update", &timer_data);
    
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        run_timer_countdown(app_handle_clone, timer_arc).await;
    });
    
    println!("Timer resumed");
    Ok(())
}

#[tauri::command]
pub async fn restart_timer(
    app_handle: AppHandle,
    timer_state: State<'_, AppTimerState>
) -> Result<(), String> {
    {
        let mut timer = timer_state.timer.lock().unwrap();
        timer.remaining_seconds = timer.original_seconds;
        timer.is_paused = true;
        timer.is_active = false;
        timer.is_running = true;
    }
    
    let timer_data = {
        let timer = timer_state.timer.lock().unwrap();
        timer.clone()
    };
    let _ = app_handle.emit_to("timer", "timer-update", &timer_data);
    
    println!("Timer restarted - press play to begin countdown");
    Ok(())
}

#[tauri::command]
pub async fn check_for_updates(app_handle: AppHandle) -> Result<bool, String> {
    match app_handle.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(_update)) => Ok(true),
                Ok(None) => Ok(false),
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn download_and_install_update(app_handle: AppHandle) -> Result<(), String> {
    match app_handle.updater() {
        Ok(updater) => {
            match updater.check().await {
                Ok(Some(update)) => {
                    let mut downloaded = 0;
                    update.download_and_install(
                        |chunk_length, content_length| {
                            downloaded += chunk_length;
                            let progress = if let Some(total) = content_length {
                                (downloaded as f64 / total as f64) * 100.0
                            } else {
                                0.0
                            };
                            let _ = app_handle.emit("download-progress", progress);
                        },
                        || {
                            let _ = app_handle.emit("download-finished", ());
                        }
                    ).await.map_err(|e| e.to_string())?;
                    Ok(())
                }
                Ok(None) => Err("No update available".to_string()),
                Err(e) => Err(e.to_string()),
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn get_current_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
pub async fn get_timer_state(timer_state: State<'_, AppTimerState>) -> Result<TimerState, String> {
    let timer = timer_state.timer.lock().unwrap();
    Ok(timer.clone())
}

#[tauri::command]
pub async fn close_timer_window(
    app_handle: AppHandle,
    timer_state: State<'_, AppTimerState>,
) -> Result<(), String> {
    {
        let mut timer = timer_state.timer.lock().unwrap();
        timer.is_running = false;
        timer.is_active = false;
        timer.is_paused = false;
    }

    if let Some(timer_window) = app_handle.get_webview_window("timer") {
        let _ = timer_window.close();
    }
    
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }

    println!("Timer window closed");
    Ok(())
}

#[tauri::command]
pub async fn hide_app_to_tray(app_handle: AppHandle) -> Result<(), String> {
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let _ = main_window.hide();
    }
    if let Some(timer_window) = app_handle.get_webview_window("timer") {
        let _ = timer_window.hide();
    }
    println!("App hidden to system tray");
    Ok(())
}

#[tauri::command]
pub async fn show_app_from_tray(app_handle: AppHandle) -> Result<(), String> {
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }
    println!("App restored from system tray");
    Ok(())
}

#[tauri::command]
pub async fn start_window_drag(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}


#[tauri::command]
pub async fn show_about_dialog(app_handle: AppHandle) -> Result<(), String> {
    create_about_dialog(&app_handle).await
}