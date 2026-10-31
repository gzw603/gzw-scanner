use enigo::{Direction, Enigo, Key, Keyboard, Settings};
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
enum InputEvent {
    Text { value: String },
    Key { combo: String },
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
fn fire_input_events(events: Vec<InputEvent>) -> Result<(), String> {
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

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fire_input_events])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
