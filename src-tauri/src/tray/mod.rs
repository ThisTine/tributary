use tauri::{
    App, AppHandle, Emitter, Manager,
    menu::{IsMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
};
use tauri_plugin_shell::ShellExt;
use crate::{model::Event, state::AppState};

const TRAY_ID: &str = "main";
const MAX_EVENTS: usize = 10;

pub fn setup_tray(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();
    let menu = build_menu(&handle, &[])?;

    let icon = tauri::include_image!("icons/tray.png");

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .icon_as_template(true)
        .menu(&menu)
        .show_menu_on_left_click(true)
        .tooltip("Tributary")
        .on_menu_event(handle_menu_event)
        .build(app)?;

    Ok(())
}

fn show_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.unminimize();
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id.as_ref().to_string();
    let app = app.clone();

    match id.as_str() {
        "show" => show_window(&app),

        "quick_add" => {
            show_window(&app);
            let _ = app.emit("open-subscribe", ());
        }

        "mark_read" => {
            tauri::async_runtime::spawn(async move {
                let (token, instance) = {
                    let state: tauri::State<AppState> = app.state();
                    let token = state.token.read().await.clone();
                    let instance = state.settings.read().await.instance.clone();
                    (token, instance)
                };
                {
                    let state: tauri::State<AppState> = app.state();
                    let mut cache = state.events_cache.write().await;
                    for e in cache.iter_mut() { e.unread = false; }
                }
                if let Some(token) = token {
                    let gl = crate::gitlab::GitLabClient::new(&instance, &token);
                    let _ = gl.mark_all_todos_done().await;
                }
                refresh_tray(&app);
            });
        }

        "poll" => { let _ = app.emit("poll-now", ()); }

        "quit" => app.exit(0),

        id if id.starts_with("ev_") => {
            let ev_id = id.strip_prefix("ev_").unwrap_or("").to_string();
            tauri::async_runtime::spawn(async move {
                let (url, token, instance) = {
                    let state: tauri::State<AppState> = app.state();
                    let token = state.token.read().await.clone();
                    let instance = state.settings.read().await.instance.clone();
                    let url = state.events_cache.read().await.iter()
                        .find(|e| e.id == ev_id).map(|e| e.web_url.clone());
                    (url, token, instance)
                };
                if let Some(url) = url {
                    if !url.is_empty() {
                        let _ = app.shell().open(&url, None);
                    } else {
                        show_window(&app);
                    }
                    // Mark read in local cache
                    {
                        let state: tauri::State<AppState> = app.state();
                        let mut cache = state.events_cache.write().await;
                        if let Some(ev) = cache.iter_mut().find(|e| e.id == ev_id) {
                            ev.unread = false;
                        }
                    }
                    // Persist to GitLab
                    if let Some(token) = token {
                        if let Some(id_str) = ev_id.strip_prefix("todo-") {
                            if let Ok(todo_id) = id_str.parse::<i64>() {
                                let gl = crate::gitlab::GitLabClient::new(&instance, &token);
                                let _ = gl.mark_todo_done(todo_id).await;
                            }
                        }
                    }
                    refresh_tray(&app);
                }
            });
        }

        _ => {}
    }
}

fn build_menu(app: &AppHandle, events: &[Event]) -> tauri::Result<Menu<tauri::Wry>> {
    let unread = events.iter().filter(|e| e.unread).count();

    // ── Top section ───────────────────────────────────────────────────────────
    let show_i = MenuItem::with_id(app, "show", "Open Tributary", true, None::<&str>)?;
    let add_i  = MenuItem::with_id(app, "quick_add", "Quick Add MR…", true, None::<&str>)?;
    let sep1   = PredefinedMenuItem::separator(app)?;

    // ── Activity header ───────────────────────────────────────────────────────
    let header_text = if unread > 0 {
        format!("Activity  —  {} unread", unread)
    } else {
        "Activity".to_string()
    };
    let act_header = MenuItem::with_id(app, "act_header", &header_text, false, None::<&str>)?;

    // ── Event items ───────────────────────────────────────────────────────────
    let event_items: Vec<MenuItem<tauri::Wry>> = events
        .iter()
        .take(MAX_EVENTS)
        .filter_map(|e| {
            let label = format_event_label(e);
            MenuItem::with_id(app, &format!("ev_{}", e.id), &label, true, None::<&str>).ok()
        })
        .collect();

    let no_act = if event_items.is_empty() {
        Some(MenuItem::with_id(app, "no_act", "    No recent activity", false, None::<&str>)?)
    } else {
        None
    };

    // ── Bottom section ────────────────────────────────────────────────────────
    let sep2      = PredefinedMenuItem::separator(app)?;
    let mark_read = MenuItem::with_id(app, "mark_read", "Mark All Read", unread > 0, None::<&str>)?;
    let sep3      = PredefinedMenuItem::separator(app)?;
    let poll_i    = MenuItem::with_id(app, "poll", "Poll Now", true, None::<&str>)?;
    let quit_i    = MenuItem::with_id(app, "quit", "Quit Tributary", true, None::<&str>)?;

    // ── Assemble ──────────────────────────────────────────────────────────────
    let mut items: Vec<&dyn IsMenuItem<tauri::Wry>> = vec![
        &show_i,
        &add_i,
        &sep1,
        &act_header,
    ];
    for item in &event_items { items.push(item); }
    if let Some(ref na) = no_act { items.push(na); }
    items.push(&sep2);
    items.push(&mark_read);
    items.push(&sep3);
    items.push(&poll_i);
    items.push(&quit_i);

    Menu::with_items(app, &items)
}

fn format_event_label(event: &Event) -> String {
    let verb = match event.kind.as_str() {
        "pipeline_failed"   => "Pipeline failed",
        "pipeline_passed"   => "Pipeline passed",
        "review_requested"  => "Review requested",
        "changes_requested" => "Changes requested",
        "approved"          => "Approved",
        "commented"         => "Commented",
        "pushed"            => "New commits",
        "mentioned"         => "Mentioned you",
        "conflict"          => "Conflicts",
        "merged"            => "Merged",
        _                   => "Activity",
    };

    let unread_dot = if event.unread { "● " } else { "  " };
    let who_prefix = event.who.as_ref()
        .map(|u| format!("{} · ", u.name))
        .unwrap_or_default();
    let mr_ref = format!("!{}  {}", event.mr_iid, truncate(&event.mr_title, 32));

    format!("{}{}{} — {}", unread_dot, who_prefix, verb, mr_ref)
}

fn truncate(s: &str, max_chars: usize) -> String {
    let chars: Vec<char> = s.chars().collect();
    if chars.len() <= max_chars {
        s.to_string()
    } else {
        let truncated: String = chars[..max_chars].iter().collect();
        format!("{}…", truncated.trim_end())
    }
}

pub fn refresh_tray(app: &AppHandle) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let events = {
            let state: tauri::State<AppState> = app.state();
            let cache = state.events_cache.read().await;
            cache.clone()
        };

        if let Ok(menu) = build_menu(&app, &events) {
            if let Some(tray) = app.tray_by_id(TRAY_ID) {
                let _ = tray.set_menu(Some(menu));

                let unread = events.iter().filter(|e| e.unread).count();
                let title = if unread > 0 { unread.to_string() } else { String::new() };
                let _ = tray.set_title(Some(&title));
            }
        }
    });
}
