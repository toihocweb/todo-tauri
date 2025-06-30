
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod types;
mod timer;
mod commands;
mod window;
mod menu;

use tauri::Manager;
use types::AppTimerState;
use menu::setup_menu_and_tray;
use commands::*;
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(AppTimerState::default())
        .setup(setup_menu_and_tray)
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .on_window_event(|window, event| {
            use tauri::WindowEvent;
            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    // Only hide to tray for main window, allow timer window to close normally
                    if window.label() == "main" {
                        println!("Main window close requested - hiding to tray");
                        window.hide().unwrap();
                        api.prevent_close();
                    }
                    // Timer window can close normally
                }
                _ => {}
            }
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "cut" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("menu-cut", ());
                    }
                }
                "copy" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("menu-copy", ());
                    }
                }
                "paste" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("menu-paste", ());
                    }
                },
                "check_updates" => {
                    let app_clone = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = crate::commands::check_for_updates(app_clone).await;
                    });
                }
                "select_all" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("menu-select-all", ());
                    }
                },
                "quit" => app.exit(0),
                "hide_to_tray" => {
                    if let Some(main_window) = app.get_webview_window("main") {
                        let _ = main_window.hide();
                    }
                    if let Some(timer_window) = app.get_webview_window("timer") {
                        let _ = timer_window.hide();
                    }
                }
                "about" => {
                    let app_clone = app.clone();
                    tauri::async_runtime::spawn(async move {
                        let _ = crate::commands::show_about_dialog(app_clone).await;
                    });
                },
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
            close_timer_window,
            hide_app_to_tray,
            show_app_from_tray,
            show_about_dialog,
            check_for_updates,
            download_and_install_update,
            get_current_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
