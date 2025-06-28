// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{
    menu::*,
    AppHandle, Manager, State, Emitter
};
use tauri_plugin_notification::NotificationExt;
use serde::{Deserialize, Serialize};

#[derive(Default, Clone, Serialize, Deserialize)]
struct TimerState {
    is_running: bool,
    is_active: bool,
    is_paused: bool,
    remaining_seconds: u64,
    original_seconds: u64,
    todo_title: String,
    todo_id: String,
}

#[derive(Default)]
struct AppTimerState {
    timer: Arc<Mutex<TimerState>>,
}

// Updated timer countdown function
async fn run_timer_countdown(app_handle: tauri::AppHandle, timer_arc: Arc<Mutex<TimerState>>) {
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

#[tauri::command]
async fn pause_timer(
    app_handle: tauri::AppHandle,
    timer_state: State<'_, AppTimerState>
) -> Result<(), String> {
    {
        let mut timer = timer_state.timer.lock().unwrap();
        timer.is_paused = true;
        timer.is_active = false;
    }
    
    // Emit updated state
    let timer_data = {
        let timer = timer_state.timer.lock().unwrap();
        timer.clone()
    };
    let _ = app_handle.emit_to("timer", "timer-update", &timer_data);
    
    println!("Timer paused");
    Ok(())
}

#[tauri::command]
async fn resume_timer(
    app_handle: tauri::AppHandle,
    timer_state: State<'_, AppTimerState>
) -> Result<(), String> {
    let timer_arc = timer_state.timer.clone();
    
    {
        let mut timer = timer_arc.lock().unwrap();
        timer.is_paused = false;
        timer.is_active = true;
        timer.is_running = true; // Make sure it's running
    }
    
    // Emit updated state
    let timer_data = {
        let timer = timer_arc.lock().unwrap();
        timer.clone()
    };
    let _ = app_handle.emit_to("timer", "timer-update", &timer_data);
    
    // Start the timer countdown
    let app_handle_clone = app_handle.clone();
    tokio::spawn(async move {
        run_timer_countdown(app_handle_clone, timer_arc).await;
    });
    
    println!("Timer resumed");
    Ok(())
}

#[tauri::command]
async fn restart_timer(
    app_handle: tauri::AppHandle,
    timer_state: State<'_, AppTimerState>
) -> Result<(), String> {
    {
        let mut timer = timer_state.timer.lock().unwrap();
        timer.remaining_seconds = timer.original_seconds;
        timer.is_paused = true;  // Set to paused state
        timer.is_active = false; // Don't start countdown automatically
        timer.is_running = true; // Keep running flag true
    }
    
    // Emit updated state
    let timer_data = {
        let timer = timer_state.timer.lock().unwrap();
        timer.clone()
    };
    let _ = app_handle.emit_to("timer", "timer-update", &timer_data);
    
    println!("Timer restarted - press play to begin countdown");
    Ok(())
}

#[tauri::command]
async fn close_timer_window(
    app_handle: AppHandle,
    timer_state: State<'_, AppTimerState>,
) -> Result<(), String> {
    // Stop the timer
    {
        let mut timer = timer_state.timer.lock().unwrap();
        timer.is_running = false;
        timer.is_active = false;
        timer.is_paused = false;
    }

    // Close timer window
    if let Some(timer_window) = app_handle.get_webview_window("timer") {
        let _ = timer_window.close();
    }
    
    // Show main window
    if let Some(main_window) = app_handle.get_webview_window("main") {
        let _ = main_window.show();
        let _ = main_window.set_focus();
    }

    println!("Timer window closed");
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn start_timer(
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
        timer.original_seconds = duration_minutes * 60; // Store original duration
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
async fn stop_timer(
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
async fn get_timer_state(timer_state: State<'_, AppTimerState>) -> Result<TimerState, String> {
    let timer = timer_state.timer.lock().unwrap();
    Ok(timer.clone())
}

#[tauri::command]
async fn start_window_drag(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

async fn create_timer_window(app_handle: &AppHandle) -> Result<(), String> {
    if let Some(existing_window) = app_handle.get_webview_window("timer") {
        let _ = existing_window.close();
    }

    let window_builder = tauri::webview::WebviewWindowBuilder::new(
        app_handle,
        "timer",
        tauri::WebviewUrl::App("timer.html".into())
    )
    .title("Todo Timer")
    .inner_size(180.0, 100.0)
    .resizable(false)
    .decorations(false)
    .shadow(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .center()  // Top-right corner
    .focused(false);

    let timer_window = window_builder.build().map_err(|e| e.to_string())?;
    let _ = timer_window.show();
    
    println!("Timer window created and shown in top-right corner");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(AppTimerState::default())
        .setup(|app| {
            let help_menu = SubmenuBuilder::new(app, "Help")
                .item(&MenuItemBuilder::new("About").id("about").build(app)?)
                .item(&MenuItemBuilder::new("Documentation").id("documentation").build(app)?)
                .build()?;

            let file_menu = SubmenuBuilder::new(app, "File")
                .item(&MenuItemBuilder::new("Quit").id("quit").build(app)?)
                .build()?;

            let edit_menu = SubmenuBuilder::new(app, "Edit")
                .item(&MenuItemBuilder::new("Cut").id("cut").build(app)?)
                .item(&MenuItemBuilder::new("Copy").id("copy").build(app)?)
                .item(&MenuItemBuilder::new("Paste").id("paste").build(app)?)
                .build()?;

            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&MenuItemBuilder::new("Refresh").id("refresh").build(app)?)
                .build()?;

            let menu = MenuBuilder::new(app)
                .item(&file_menu)
                .item(&edit_menu)
                .item(&view_menu)
                .item(&help_menu)
                .build()?;

            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "quit" => app.exit(0),
                "about" => println!("About clicked"),
                _ => println!("Menu item {:?} clicked", event.id()),
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            start_timer,
            stop_timer,
            get_timer_state,
            start_window_drag,
            pause_timer,
            resume_timer,
            restart_timer,
            close_timer_window  // Add this command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}