use crate::InputEvent;

#[cfg(target_os = "windows")]
mod windows {
    use super::InputEvent;
    use crate::{parse_combo, KeyCombo, Modifier};
    use std::mem::size_of;
    use windows_sys::Win32::Foundation::{GetLastError, SetLastError, HWND, LPARAM, WPARAM};
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        MapVirtualKeyW, SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT,
        KEYEVENTF_EXTENDEDKEY, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumChildWindows, GetClassNameW, GetForegroundWindow, GetGUIThreadInfo,
        GetWindowThreadProcessId, PostMessageW, GUITHREADINFO, WM_CHAR, WM_KEYDOWN, WM_KEYUP,
    };

    const KEYBOARD_INPUT: u32 = INPUT_KEYBOARD;
    const KEY_UP: u32 = KEYEVENTF_KEYUP;
    const UNICODE: u32 = KEYEVENTF_UNICODE;
    const EXTENDED: u32 = KEYEVENTF_EXTENDEDKEY;

    pub fn fire(events: Vec<InputEvent>) -> Result<bool, String> {
        let mut compatibility = false;
        for event in events {
            match event {
                InputEvent::Text { value } => {
                    compatibility |= type_text(&value)?;
                }
                InputEvent::Key { combo } => {
                    compatibility |= send_combo(&combo)?;
                }
            }
        }
        Ok(compatibility)
    }

    fn keyboard_input(vk: u16, scan: u16, flags: u32, extended: bool) -> INPUT {
        let flags = if extended { flags | EXTENDED } else { flags };
        INPUT {
            r#type: KEYBOARD_INPUT,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: vk,
                    wScan: scan,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        }
    }

    fn unicode_input(unit: u16, up: bool) -> INPUT {
        keyboard_input(0, unit, if up { UNICODE | KEY_UP } else { UNICODE }, false)
    }

    fn send_events(events: &[INPUT]) -> Result<(), (u32, u32)> {
        unsafe { SetLastError(0) };
        let sent = unsafe {
            SendInput(
                events.len() as u32,
                events.as_ptr(),
                size_of::<INPUT>() as i32,
            )
        };
        if sent == events.len() as u32 {
            Ok(())
        } else {
            Err((sent, unsafe { GetLastError() }))
        }
    }

    fn failure(stage: &str, sent: u32, total: u32, code: u32, fallback: bool) -> String {
        format!(
            "INPUT_SEND_FAILED:{stage}:SendInput {sent}/{total}, Win32 {code}, fallback={}, admin={}, targetClass={}",
            if fallback { "sent" } else { "unavailable" },
            if crate::focus::is_admin() { "yes" } else { "no" },
            window_class(unsafe { GetForegroundWindow() }),
        )
    }

    fn type_text(text: &str) -> Result<bool, String> {
        if text.is_empty() {
            return Ok(false);
        }

        let mut chars = text.chars().peekable();
        let mut compatibility = false;
        while let Some(character) = chars.next() {
            if character == '\r' {
                if chars.peek() == Some(&'\n') {
                    continue;
                }
                compatibility |= send_combo("Enter")?;
                continue;
            }
            if character == '\n' {
                compatibility |= send_combo("Enter")?;
                continue;
            }
            if character == '\t' {
                compatibility |= send_combo("Tab")?;
                continue;
            }

            let mut remaining = String::new();
            remaining.push(character);
            remaining.extend(chars.clone());
            let mut units = [0u16; 2];
            let encoded = character.encode_utf16(&mut units);
            let mut events = Vec::with_capacity(encoded.len() * 2);
            for unit in encoded {
                events.push(unicode_input(*unit, false));
                events.push(unicode_input(*unit, true));
            }

            match send_events(&events) {
                Ok(()) => {}
                Err((0, code)) => {
                    if try_window_text(&remaining) {
                        return Ok(true);
                    }
                    return Err(failure("text", 0, events.len() as u32, code, false));
                }
                Err((sent, code)) => {
                    let _ = release_modifiers();
                    return Err(failure("text", sent, events.len() as u32, code, false));
                }
            }
        }

        Ok(compatibility)
    }

    fn send_combo(combo: &str) -> Result<bool, String> {
        let parsed = parse_combo(combo)?;
        let main = main_vk(&parsed.main_key)
            .ok_or_else(|| format!("Unsupported key: {}", parsed.main_key))?;
        let mut events = Vec::with_capacity((parsed.modifiers.len() * 2) + 2);

        for modifier in &parsed.modifiers {
            events.push(keyboard_input(modifier_vk(modifier), 0, 0, false));
        }
        events.push(keyboard_input(main, 0, 0, is_extended_key(main)));
        events.push(keyboard_input(main, 0, KEY_UP, is_extended_key(main)));
        for modifier in parsed.modifiers.iter().rev() {
            events.push(keyboard_input(modifier_vk(modifier), 0, KEY_UP, false));
        }

        match send_events(&events) {
            Ok(()) => Ok(false),
            Err((0, code)) => {
                if post_key_combination(&parsed) {
                    Ok(true)
                } else {
                    Err(failure("key", 0, events.len() as u32, code, false))
                }
            }
            Err((sent, code)) => {
                let _ = release_modifiers();
                Err(failure("key", sent, events.len() as u32, code, false))
            }
        }
    }

    fn release_modifiers() {
        let events = [
            keyboard_input(0x10, 0, KEY_UP, false),
            keyboard_input(0x11, 0, KEY_UP, false),
            keyboard_input(0x12, 0, KEY_UP, false),
            keyboard_input(0x5B, 0, KEY_UP, false),
        ];
        let _ = send_events(&events);
    }

    fn modifier_vk(modifier: &Modifier) -> u16 {
        match modifier {
            Modifier::Ctrl => 0x11,
            Modifier::Alt => 0x12,
            Modifier::Shift => 0x10,
            Modifier::Win => 0x5B,
        }
    }

    fn main_vk(value: &str) -> Option<u16> {
        match value {
            "Up" => Some(0x26),
            "Down" => Some(0x28),
            "Left" => Some(0x25),
            "Right" => Some(0x27),
            "Home" => Some(0x24),
            "End" => Some(0x23),
            "PageUp" => Some(0x21),
            "PageDown" => Some(0x22),
            "Esc" => Some(0x1B),
            "Backspace" => Some(0x08),
            "Delete" => Some(0x2E),
            "Insert" => Some(0x2D),
            "Space" => Some(0x20),
            "Enter" => Some(0x0D),
            "Tab" => Some(0x09),
            "F1" => Some(0x70),
            "F2" => Some(0x71),
            "F3" => Some(0x72),
            "F4" => Some(0x73),
            "F5" => Some(0x74),
            "F6" => Some(0x75),
            "F7" => Some(0x76),
            "F8" => Some(0x77),
            "F9" => Some(0x78),
            "F10" => Some(0x79),
            "F11" => Some(0x7A),
            "F12" => Some(0x7B),
            value if value.len() == 1 => value.chars().next().map(|character| character as u16),
            _ => None,
        }
    }

    fn is_extended_key(vk: u16) -> bool {
        matches!(
            vk,
            0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26 | 0x27 | 0x28 | 0x2D | 0x2E
        )
    }

    fn window_class(window: HWND) -> String {
        if window.is_null() {
            return String::new();
        }
        let mut buffer = [0u16; 256];
        let length = unsafe { GetClassNameW(window, buffer.as_mut_ptr(), buffer.len() as i32) };
        if length <= 0 {
            String::new()
        } else {
            String::from_utf16_lossy(&buffer[..length as usize])
        }
    }

    unsafe extern "system" fn find_renderer(window: HWND, lparam: LPARAM) -> i32 {
        if window_class(window) == "Chrome_RenderWidgetHostHWND" {
            *(lparam as *mut HWND) = window;
            return 0;
        }
        1
    }

    fn chromium_renderer(parent: HWND) -> HWND {
        let mut found: HWND = std::ptr::null_mut();
        unsafe {
            EnumChildWindows(
                parent,
                Some(find_renderer),
                &mut found as *mut HWND as LPARAM,
            );
        }
        found
    }

    fn focused_control(parent: HWND) -> HWND {
        let mut process_id = 0;
        let thread_id = unsafe { GetWindowThreadProcessId(parent, &mut process_id) };
        let mut info = GUITHREADINFO {
            cbSize: size_of::<GUITHREADINFO>() as u32,
            ..Default::default()
        };
        if unsafe { GetGUIThreadInfo(thread_id, &mut info) } != 0 && !info.hwndFocus.is_null() {
            info.hwndFocus
        } else {
            parent
        }
    }

    fn is_text_target(window: HWND) -> bool {
        let class = window_class(window);
        class.starts_with("Edit")
            || class.starts_with("RichEdit")
            || class.contains("Internet Explorer_Server")
    }

    fn text_fallback_target(parent: HWND) -> Option<HWND> {
        let renderer = chromium_renderer(parent);
        if !renderer.is_null() {
            return Some(renderer);
        }
        let focused = focused_control(parent);
        is_text_target(focused).then_some(focused)
    }

    fn post_text(window: HWND, text: &str) -> bool {
        for character in text.chars() {
            let mut units = [0u16; 2];
            for unit in character.encode_utf16(&mut units) {
                if unsafe { PostMessageW(window, WM_CHAR, *unit as WPARAM, 1) } == 0 {
                    return false;
                }
            }
        }
        true
    }

    fn try_window_text(text: &str) -> bool {
        let target = unsafe { GetForegroundWindow() };
        let Some(window) = text_fallback_target(target) else {
            return false;
        };
        post_text(window, text)
    }

    fn post_key(window: HWND, vk: u16, down: bool, extended: bool) -> bool {
        let scan = unsafe { MapVirtualKeyW(vk as u32, 0) } as isize;
        let mut lparam = 1isize | (scan << 16);
        if extended {
            lparam |= 1isize << 24;
        }
        if !down {
            lparam |= (1u64 << 30 | 1u64 << 31) as isize;
        }
        let message = if down { WM_KEYDOWN } else { WM_KEYUP };
        unsafe { PostMessageW(window, message, vk as WPARAM, lparam) != 0 }
    }

    fn post_key_combination(parsed: &KeyCombo) -> bool {
        let target = unsafe { GetForegroundWindow() };
        let renderer = chromium_renderer(target);
        let window = if !renderer.is_null() {
            renderer
        } else {
            let focused = focused_control(target);
            if !is_text_target(focused) {
                return false;
            }
            focused
        };

        for modifier in &parsed.modifiers {
            if !post_key(window, modifier_vk(modifier), true, false) {
                return false;
            }
        }
        let Some(main) = main_vk(&parsed.main_key) else {
            return false;
        };
        let extended = is_extended_key(main);
        if !post_key(window, main, true, extended) {
            return false;
        }
        if parsed.modifiers.is_empty() && matches!(main, 0x20 | 0x0D | 0x09) {
            if unsafe { PostMessageW(window, WM_CHAR, main as WPARAM, 1) } == 0 {
                return false;
            }
        }
        if !post_key(window, main, false, extended) {
            return false;
        }
        for modifier in parsed.modifiers.iter().rev() {
            if !post_key(window, modifier_vk(modifier), false, false) {
                return false;
            }
        }
        true
    }
}

#[cfg(target_os = "windows")]
pub use windows::fire;

#[cfg(not(target_os = "windows"))]
pub fn fire(_events: Vec<InputEvent>) -> Result<bool, String> {
    Err("INPUT_UNSUPPORTED".to_string())
}
