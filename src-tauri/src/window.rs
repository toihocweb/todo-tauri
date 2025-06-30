
use tauri::AppHandle;
use tauri::Manager;

pub async fn create_timer_window(app_handle: &AppHandle) -> Result<(), String> {
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
    .center()
    .focused(false);

    let timer_window = window_builder.build().map_err(|e| e.to_string())?;
    let _ = timer_window.show();
    
    println!("Timer window created and shown in center");
    Ok(())
}

pub async fn create_about_dialog(app_handle: &AppHandle) -> Result<(), String> {
    if let Some(existing_window) = app_handle.get_webview_window("about") {
        let _ = existing_window.close();
    }

    let window_builder = tauri::webview::WebviewWindowBuilder::new(
        app_handle,
        "about",
        tauri::WebviewUrl::App("about.html".into())
    )
    .title("About")
    .inner_size(400.0, 300.0)
    .resizable(false)
    .center()
    .focused(true);

    let about_window = window_builder.build().map_err(|e| e.to_string())?;
    let _ = about_window.show();
    
    Ok(())
}
