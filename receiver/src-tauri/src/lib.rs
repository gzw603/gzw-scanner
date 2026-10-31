use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
enum InputEvent {
    Text { value: String },
    Key { combo: String },
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct InputReport {
    target_title: String,
    restored_focus: bool,
}

#[derive(Clone, Debug, Serialize)]
struct WindowTarget {
    id: String,
    title: String,
}

#[derive(Debug, PartialEq, Eq)]
enum Modifier {
    Ctrl,
    Alt,
    Shift,
    Win,
}

#[derive(Debug, PartialEq, Eq)]
struct KeyCombo {
    modifiers: Vec<Modifier>,
    main_key: String,
}

fn normalize_main_key(value: &str) -> Option<String> {
    let lower = value.to_ascii_lowercase();
    if lower.len() == 1 && lower.as_bytes()[0].is_ascii_alphabetic() {
        return Some(lower.to_ascii_uppercase());
    }
    if lower.len() == 1 && lower.as_bytes()[0].is_ascii_digit() {
        return Some(lower);
    }
    if let Some(number) = lower.strip_prefix('f') {
        if let Ok(number) = number.parse::<u8>() {
            if (1..=12).contains(&number) {
                return Some(format!("F{number}"));
            }
        }
    }

    let key = match lower.as_str() {
        "up" | "arrowup" => "Up",
        "down" | "arrowdown" => "Down",
        "left" | "arrowleft" => "Left",
        "right" | "arrowright" => "Right",
        "home" => "Home",
        "end" => "End",
        "pageup" => "PageUp",
        "pagedown" => "PageDown",
        "esc" | "escape" => "Esc",
        "backspace" => "Backspace",
        "delete" => "Delete",
        "insert" => "Insert",
        "space" => "Space",
        "enter" | "return" => "Enter",
        "tab" => "Tab",
        _ => return None,
    };

    Some(key.to_string())
}

fn parse_combo(combo: &str) -> Result<KeyCombo, String> {
    let mut modifiers = Vec::new();
    let mut main_key = None;

    for part in combo.split('+').map(str::trim).filter(|part| !part.is_empty()) {
        let modifier = match part.to_ascii_lowercase().as_str() {
            "ctrl" | "control" => Some(Modifier::Ctrl),
            "alt" | "option" => Some(Modifier::Alt),
            "shift" => Some(Modifier::Shift),
            "win" | "windows" | "meta" => Some(Modifier::Win),
            _ => None,
        };

        if let Some(modifier) = modifier {
            if modifiers.contains(&modifier) {
                return Err("Duplicate modifier".to_string());
            }
            modifiers.push(modifier);
            continue;
        }

        let key = normalize_main_key(part).ok_or_else(|| format!("Unsupported key: {part}"))?;
        if main_key.replace(key).is_some() {
            return Err("Use exactly one main key".to_string());
        }
    }

    let main_key = main_key.ok_or_else(|| "A main key is required".to_string())?;
    if modifiers.contains(&Modifier::Ctrl)
        && modifiers.contains(&Modifier::Alt)
        && main_key == "Delete"
    {
        return Err("Ctrl+Alt+Delete is reserved by Windows".to_string());
    }

    Ok(KeyCombo { modifiers, main_key })
}

fn modifier_key(modifier: &Modifier) -> Key {
    match modifier {
        Modifier::Ctrl => Key::Control,
        Modifier::Alt => Key::Alt,
        Modifier::Shift => Key::Shift,
        Modifier::Win => Key::Meta,
    }
}

fn main_key(value: &str) -> Option<Key> {
    match value {
        "Up" => Some(Key::UpArrow),
        "Down" => Some(Key::DownArrow),
        "Left" => Some(Key::LeftArrow),
        "Right" => Some(Key::RightArrow),
        "Home" => Some(Key::Home),
        "End" => Some(Key::End),
        "PageUp" => Some(Key::PageUp),
        "PageDown" => Some(Key::PageDown),
        "Esc" => Some(Key::Escape),
        "Backspace" => Some(Key::Backspace),
        "Delete" => Some(Key::Delete),
        "Insert" => Some(Key::Other(0x2D)),
        "Space" => Some(Key::Space),
        "Enter" => Some(Key::Return),
        "Tab" => Some(Key::Tab),
        "F1" => Some(Key::F1),
        "F2" => Some(Key::F2),
        "F3" => Some(Key::F3),
        "F4" => Some(Key::F4),
        "F5" => Some(Key::F5),
        "F6" => Some(Key::F6),
        "F7" => Some(Key::F7),
        "F8" => Some(Key::F8),
        "F9" => Some(Key::F9),
        "F10" => Some(Key::F10),
        "F11" => Some(Key::F11),
        "F12" => Some(Key::F12),
        value if value.len() == 1 => {
            value.chars().next().map(|character| Key::Other(character as u32))
        }
        _ => None,
    }
}

fn fire_combo(enigo: &mut Enigo, combo: &str) -> Result<(), String> {
    let parsed = parse_combo(combo)?;
    let main = main_key(&parsed.main_key)
        .ok_or_else(|| format!("Unsupported key: {}", parsed.main_key))?;
    let mut pressed = Vec::new();

    let result = (|| {
        for modifier in &parsed.modifiers {
            let key = modifier_key(modifier);
            enigo
                .key(key, Direction::Press)
                .map_err(|error| format!("Could not press modifier: {error}"))?;
            pressed.push(key);
        }

        enigo
            .key(main, Direction::Click)
            .map_err(|error| format!("Could not press key: {error}"))
    })();

    for key in pressed.into_iter().rev() {
        let _ = enigo.key(key, Direction::Release);
    }

    result
}

#[tauri::command]
fn fire_input_events(events: Vec<InputEvent>) -> Result<InputReport, String> {
    let (target_title, restored_focus) = focus::prepare_target()?;
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|error| format!("Could not initialize keyboard input: {error}"))?;

    for event in events {
        match event {
            InputEvent::Text { value } => enigo
                .text(&value)
                .map_err(|error| format!("Could not type text: {error}"))?,
            InputEvent::Key { combo } => fire_combo(&mut enigo, &combo)?,
        }
    }

    Ok(InputReport {
        target_title,
        restored_focus,
    })
}

#[tauri::command]
fn list_target_windows() -> Vec<WindowTarget> {
    focus::list_targets()
}

#[tauri::command]
fn lock_target_window(id: String) -> Result<WindowTarget, String> {
    focus::lock_target(&id)
}

#[tauri::command]
fn get_target_window() -> Option<WindowTarget> {
    focus::locked_target()
}

#[tauri::command]
fn clear_target_window() {
    focus::clear_target();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    focus::start_tracker();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            fire_input_events,
            list_target_windows,
            lock_target_window,
            get_target_window,
            clear_target_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(not(target_os = "windows"))]
mod focus {
    pub fn start_tracker() {}

    pub fn prepare_target() -> Result<(String, bool), String> {
        Ok(("".to_string(), false))
    }

    pub fn list_targets() -> Vec<super::WindowTarget> {
        Vec::new()
    }

    pub fn lock_target(_id: &str) -> Result<super::WindowTarget, String> {
        Err("WINDOW_TARGET_UNSUPPORTED".to_string())
    }

    pub fn locked_target() -> Option<super::WindowTarget> {
        None
    }

    pub fn clear_target() {}
}

#[cfg(target_os = "windows")]
mod focus {
    use super::WindowTarget;
    use std::ffi::c_void;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::thread;
    use std::time::Duration;

    type Hwnd = *mut c_void;
    type Lparam = isize;
    type EnumWindowsProc = Option<unsafe extern "system" fn(Hwnd, Lparam) -> i32>;

    const SW_RESTORE: i32 = 9;

    static LAST_EXTERNAL_WINDOW: AtomicUsize = AtomicUsize::new(0);
    static LOCKED_TARGET: AtomicUsize = AtomicUsize::new(0);

    #[link(name = "user32")]
    extern "system" {
        fn GetForegroundWindow() -> Hwnd;
        fn GetWindowThreadProcessId(window: Hwnd, process_id: *mut u32) -> u32;
        fn GetWindowTextW(window: Hwnd, text: *mut u16, max_count: i32) -> i32;
        fn GetClassNameW(window: Hwnd, class_name: *mut u16, max_count: i32) -> i32;
        fn IsWindow(window: Hwnd) -> i32;
        fn IsWindowVisible(window: Hwnd) -> i32;
        fn IsIconic(window: Hwnd) -> i32;
        fn ShowWindow(window: Hwnd, command: i32) -> i32;
        fn SetForegroundWindow(window: Hwnd) -> i32;
        fn EnumWindows(callback: EnumWindowsProc, lparam: Lparam) -> i32;
    }

    #[link(name = "kernel32")]
    extern "system" {
        fn GetCurrentProcessId() -> u32;
    }

    fn window_text(window: Hwnd) -> String {
        let mut buffer = [0u16; 512];
        let length = unsafe { GetWindowTextW(window, buffer.as_mut_ptr(), buffer.len() as i32) };
        if length <= 0 {
            return String::new();
        }
        String::from_utf16_lossy(&buffer[..length as usize])
    }

    fn window_class(window: Hwnd) -> String {
        let mut buffer = [0u16; 256];
        let length = unsafe { GetClassNameW(window, buffer.as_mut_ptr(), buffer.len() as i32) };
        if length <= 0 {
            return String::new();
        }
        String::from_utf16_lossy(&buffer[..length as usize])
    }

    fn is_own_window(window: Hwnd) -> bool {
        let mut process_id = 0;
        unsafe { GetWindowThreadProcessId(window, &mut process_id) };
        process_id == unsafe { GetCurrentProcessId() }
    }

    fn is_shell_window(window: Hwnd) -> bool {
        matches!(
            window_class(window).as_str(),
            "Progman" | "WorkerW" | "Shell_TrayWnd" | "Shell_SecondaryTrayWnd"
        )
    }

    fn is_external_target(window: Hwnd) -> bool {
        !window.is_null()
            && !is_own_window(window)
            && !is_shell_window(window)
            && unsafe { IsWindowVisible(window) } != 0
    }

    fn target_for(window: Hwnd) -> WindowTarget {
        WindowTarget {
            id: (window as usize).to_string(),
            title: window_text(window),
        }
    }

    fn focus_window(window: Hwnd) -> Result<String, String> {
        if !is_external_target(window) {
            LOCKED_TARGET.store(0, Ordering::Relaxed);
            return Err("LOCKED_TARGET_UNAVAILABLE".to_string());
        }

        if unsafe { GetForegroundWindow() } != window {
            if unsafe { IsIconic(window) } != 0 {
                unsafe { ShowWindow(window, SW_RESTORE) };
            }
            unsafe { SetForegroundWindow(window) };
            thread::sleep(Duration::from_millis(180));
        }

        if unsafe { GetForegroundWindow() } != window {
            return Err("FOCUS_RESTORE_FAILED".to_string());
        }

        Ok(window_text(window))
    }

    unsafe extern "system" fn collect_window(window: Hwnd, lparam: Lparam) -> i32 {
        if is_external_target(window) {
            let title = window_text(window).trim().to_string();
            if !title.is_empty() {
                let targets = &mut *(lparam as *mut Vec<WindowTarget>);
                targets.push(WindowTarget {
                    id: (window as usize).to_string(),
                    title,
                });
            }
        }
        1
    }

    pub fn start_tracker() {
        thread::spawn(|| loop {
            let window = unsafe { GetForegroundWindow() };
            if is_external_target(window) {
                LAST_EXTERNAL_WINDOW.store(window as usize, Ordering::Relaxed);
            }
            thread::sleep(Duration::from_millis(120));
        });
    }

    pub fn list_targets() -> Vec<WindowTarget> {
        let mut targets: Vec<WindowTarget> = Vec::new();
        unsafe {
            EnumWindows(
                Some(collect_window),
                &mut targets as *mut Vec<WindowTarget> as Lparam,
            );
        }
        targets.sort_by_key(|target| target.title.to_lowercase());
        targets.truncate(100);
        targets
    }

    pub fn lock_target(id: &str) -> Result<WindowTarget, String> {
        let id = id
            .parse::<usize>()
            .map_err(|_| "INVALID_WINDOW_TARGET".to_string())?;
        let window = id as Hwnd;
        if !is_external_target(window) {
            return Err("INVALID_WINDOW_TARGET".to_string());
        }

        LOCKED_TARGET.store(id, Ordering::Relaxed);
        Ok(target_for(window))
    }

    pub fn locked_target() -> Option<WindowTarget> {
        let id = LOCKED_TARGET.load(Ordering::Relaxed);
        if id == 0 {
            return None;
        }

        let window = id as Hwnd;
        if !is_external_target(window) {
            LOCKED_TARGET.store(0, Ordering::Relaxed);
            return None;
        }
        Some(target_for(window))
    }

    pub fn clear_target() {
        LOCKED_TARGET.store(0, Ordering::Relaxed);
    }

    pub fn prepare_target() -> Result<(String, bool), String> {
        let locked = LOCKED_TARGET.load(Ordering::Relaxed);
        if locked != 0 {
            return focus_window(locked as Hwnd).map(|title| (title, true));
        }

        let foreground = unsafe { GetForegroundWindow() };
        if is_external_target(foreground) {
            return Ok((window_text(foreground), false));
        }

        let previous = LAST_EXTERNAL_WINDOW.load(Ordering::Relaxed) as Hwnd;
        if previous.is_null() || unsafe { IsWindow(previous) } == 0 {
            return Err("NO_INPUT_TARGET".to_string());
        }

        if unsafe { IsIconic(previous) } != 0 {
            unsafe { ShowWindow(previous, SW_RESTORE) };
        }
        unsafe { SetForegroundWindow(previous) };
        thread::sleep(Duration::from_millis(180));

        let restored = unsafe { GetForegroundWindow() };
        if restored != previous || !is_external_target(restored) {
            return Err("FOCUS_RESTORE_FAILED".to_string());
        }

        Ok((window_text(restored), true))
    }
}

#[cfg(test)]
mod tests {
    use super::{parse_combo, KeyCombo, Modifier};

    #[test]
    fn parses_and_normalizes_combinations() {
        assert_eq!(
            parse_combo("shift + ctrl + v"),
            Ok(KeyCombo {
                modifiers: vec![Modifier::Shift, Modifier::Ctrl],
                main_key: "V".to_string(),
            })
        );
        assert_eq!(
            parse_combo("WIN+ARROWUP"),
            Ok(KeyCombo {
                modifiers: vec![Modifier::Win],
                main_key: "Up".to_string(),
            })
        );
    }

    #[test]
    fn rejects_invalid_combinations() {
        assert!(parse_combo("").is_err());
        assert!(parse_combo("Ctrl").is_err());
        assert!(parse_combo("Ctrl+Ctrl+V").is_err());
        assert!(parse_combo("Ctrl+F13").is_err());
        assert!(parse_combo("Ctrl+Alt+Delete").is_err());
    }
}
