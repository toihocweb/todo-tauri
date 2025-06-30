
use tauri::{
    menu::*,
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, Manager,
};

pub fn setup_menu_and_tray(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Create application menu
    let help_menu = SubmenuBuilder::new(app, "Help")
        .item(&MenuItemBuilder::new("Check for Updates").id("check_updates").build(app)?)
        .separator()
        .item(&MenuItemBuilder::new("About").id("about").build(app)?)
        .item(&MenuItemBuilder::new("Documentation").id("documentation").build(app)?)
        .build()?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&MenuItemBuilder::new("Hide to Tray").id("hide_to_tray").build(app)?)
        .separator()
        .item(&MenuItemBuilder::new("Quit").id("quit").build(app)?)
        .build()?;

        let edit_menu = SubmenuBuilder::new(app, "Edit")
        .item(&MenuItemBuilder::new("Cut")
            .id("cut")
            .accelerator("CmdOrCtrl+X")
            .build(app)?)
        .item(&MenuItemBuilder::new("Copy")
            .id("copy")
            .accelerator("CmdOrCtrl+C")
            .build(app)?)
        .item(&MenuItemBuilder::new("Paste")
            .id("paste")
            .accelerator("CmdOrCtrl+V")
            .build(app)?)
        .item(&MenuItemBuilder::new("Select All")
            .id("select_all")
            .accelerator("CmdOrCtrl+A")
            .build(app)?)
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

    // Create system tray menu
    let show_item = MenuItem::with_id(app, "tray_show", "Show Todo App", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "tray_hide", "Hide Todo App", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "tray_quit", "Quit", true, None::<&str>)?;
    
    let tray_menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;

    // Create system tray icon
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&tray_menu)
        .tooltip("Todo App - Timer & Task Manager")
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "tray_show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "tray_hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
                if let Some(timer_window) = app.get_webview_window("timer") {
                    let _ = timer_window.hide();
                }
            }
            "tray_quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                        // Also hide timer window if visible
                        if let Some(timer_window) = app.get_webview_window("timer") {
                            let _ = timer_window.hide();
                        }
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    println!("System tray icon created successfully");
    Ok(())
}
