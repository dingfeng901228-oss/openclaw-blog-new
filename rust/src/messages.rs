//! Locale strings, read from the Next.js project's `messages/` folder.
//!
//! The site keeps its translations in `messages/{locale}.json`. The Rust
//! generator reads the same files so the wording cannot drift between
//! the two implementations.

use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

/// The `nav` section of a locale's messages: home, blog, about.
pub type NavLabels = (String, String, String);

/// Read the `nav` labels for `locale`.
///
/// Falls back to English if the file is missing or malformed, so a
/// translation problem never stops the build.
pub fn nav_labels(locale: &str) -> NavLabels {
    let default = ("Home".to_string(), "Blog".to_string(), "About".to_string());
    let path = messages_dir().join(format!("{locale}.json"));
    let Ok(text) = fs::read_to_string(&path) else {
        return default;
    };
    let Ok(map) = serde_json::from_str::<BTreeMap<String, serde_json::Value>>(&text) else {
        return default;
    };
    let nav = match map.get("nav") {
        Some(serde_json::Value::Object(nav)) => nav,
        _ => return default,
    };
    let home = nav
        .get("home")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or(default.0);
    let blog = nav
        .get("blog")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or(default.1);
    let about = nav
        .get("about")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or(default.2);
    (home, blog, about)
}

/// The directory holding `messages/{locale}.json`.
///
/// Set by `set_messages_dir()` during the build.
fn messages_dir() -> std::path::PathBuf {
    MESSAGES_DIR
        .get()
        .cloned()
        .unwrap_or_else(|| Path::new("F:/WebSite/openclaw-blog-new/messages").to_path_buf())
}

static MESSAGES_DIR: std::sync::OnceLock<std::path::PathBuf> = std::sync::OnceLock::new();

/// Point the generator at the project's `messages/` directory.
pub fn set_messages_dir(dir: &Path) {
    let _ = MESSAGES_DIR.set(dir.to_path_buf());
}
