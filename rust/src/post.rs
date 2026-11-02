//! Content model: parse the MDX frontmatter the Next.js blog uses.
//!
//! The on-disk format is a single YAML frontmatter block followed by a
//! markdown body. The frontmatter carries three sibling locale blocks
//! (`en`, `zh`, `ja`), each with `title`, `excerpt`, `content`, `tags`
//! and `category`. The locale `content` is a YAML literal block, so it
//! arrives pre-formatted with its original indentation intact.
//!
//! Two parsing details follow `gray-matter` (which uses `js-yaml` with
//! the default schema) and are reproduced here:
//!
//! * If the closing `---` of the frontmatter block is missing,
//!   `gray-matter` treats the *entire* file as YAML. One post in the
//!   repo relies on that: its frontmatter never closes and the whole
//!   article lives inside YAML block scalars.
//! * An unquoted ISO timestamp (`date: 2026-07-01T00:00:00.000Z`) is
//!   parsed by `js-yaml` into a **Date object**, not a string. The
//!   distinction is observable in the rendered page, so it is tracked
//!   explicitly as `date_is_timestamp`.

use serde::Deserialize;

/// One locale's worth of a post.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct LocaleContent {
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub excerpt: String,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub tags: Vec<String>,
    /// The category this post belongs to.
    ///
    /// The Next.js site reads it from the locale block and falls back
    /// to "Uncategorized" when it is missing.
    #[serde(default)]
    pub category: Option<String>,
}

impl LocaleContent {
    /// The post's category, with the Next.js fallback applied.
    pub fn category_or_default(&self) -> &str {
        match self.category.as_deref() {
            Some(c) if !c.is_empty() => c,
            _ => "Uncategorized",
        }
    }
}

/// A post, as loaded from one `.mdx` file.
#[derive(Debug, Clone, Deserialize)]
pub struct Post {
    pub slug: String,
    #[serde(default)]
    pub date: String,
    /// The `translationKey` frontmatter field. The Next.js site uses
    /// it to look up a translation, but the Rust build keys translations
    /// by slug, so the value is parsed and kept for reference only.
    #[serde(rename = "translationKey", default)]
    #[allow(dead_code)]
    pub translation_key: String,
    #[serde(default)]
    pub status: String,
    #[serde(default)]
    #[allow(dead_code)]
    pub featured: bool,
    /// Whether the `date` scalar was quoted in the source.
    ///
    /// `js-yaml` turns an *unquoted* ISO timestamp into a Date object.
    /// The Next.js render then emits `[object Object]` for the
    /// `article:published_time` meta tag (it stringifies the object) but
    /// a proper ISO string for the JSON-LD (JSON.stringify calls
    /// `toJSON` on Dates). Both are observable, so the distinction is
    /// tracked.
    #[serde(skip)]
    pub date_is_quoted: bool,
    #[serde(default)]
    pub en: LocaleContent,
    #[serde(default)]
    pub zh: LocaleContent,
    #[serde(default)]
    pub ja: LocaleContent,
}

impl Post {
    /// The locale block for `loc`.
    pub fn locale(&self, loc: &str) -> &LocaleContent {
        match loc {
            "zh" => &self.zh,
            "ja" => &self.ja,
            _ => &self.en,
        }
    }

    /// Sort key for the blog list: newest first.
    ///
    /// `js-yaml` gives a Date object for unquoted timestamps and a
    /// string for quoted ones, and `getAllPosts` sorts with
    /// `new Date(date).getTime()`. Both forms must therefore compare by
    /// calendar date, not by raw string -- `"2026-10-07"` and
    /// `"2026-10-07T00:00:00.000Z"` are the same instant but different
    /// strings.
    pub fn date_key(&self) -> (i32, u32, u32) {
        let mut parts = self.date.split('-');
        let y: i32 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
        let m: u32 = parts
            .next()
            .and_then(|s| s.get(0..2).and_then(|v| v.parse().ok()))
            .unwrap_or(0);
        let d: u32 = parts
            .next()
            .and_then(|s| s.get(0..2).and_then(|v| v.parse().ok()))
            .unwrap_or(0);
        (y, m, d)
    }

    /// The `article:published_time` meta content, as the Next.js build
    /// renders it.
    ///
    /// A quoted date stays a string and is emitted verbatim. An unquoted
    /// timestamp is a Date object, and the metadata pipeline stringifies
    /// it as `[object Object]`.
    pub fn published_time_meta(&self) -> String {
        if self.date_is_quoted {
            self.date.clone()
        } else {
            "[object Object]".to_string()
        }
    }

    /// The JSON-LD `datePublished` value.
    ///
    /// `JSON.stringify` calls `toJSON()` on a Date, producing an ISO
    /// string with milliseconds.
    pub fn date_published_json(&self) -> String {
        if self.date_is_quoted {
            self.date.clone()
        } else {
            iso_with_millis(&self.date)
        }
    }

    /// Whether this post should be published at all.
    ///
    /// `getAllPosts` filters on `status === 'published'`; drafts are
    /// excluded from the list and get no page.
    pub fn is_published(&self) -> bool {
        self.status == "published"
    }
}

/// Split an MDX file into (yaml_frontmatter, markdown_body).
///
/// This mirrors `gray-matter`'s `parseMatter` exactly, because the
/// Next.js build reads the posts with gray-matter and the Rust build must
/// see the same data:
///
/// - The file must start with `---`; the next character must not also be
///   `-` (otherwise it is not a frontmatter delimiter).
/// - The closing delimiter is `\n---`. If it is **not found**, gray-matter
///   treats the *entire* remainder of the file as YAML and leaves the
///   markdown body empty.
/// - The block is passed to the YAML parser unchanged; `#` is a comment
///   only at the YAML level, never inside a block scalar.
/// - After the closing delimiter, one leading `\r` and one leading `\n`
///   are removed.
pub fn split_frontmatter(src: &str) -> Result<(String, String), String> {
    let src = src.strip_prefix('\u{feff}').unwrap_or(src);
    const OPEN: &str = "---";

    if !src.starts_with(OPEN) {
        return Err("file does not start with a YAML frontmatter block".to_string());
    }
    // If the character right after `---` is also `-`, it is not a delimiter.
    if src.as_bytes().get(OPEN.len()) == Some(&b'-') {
        return Err("file does not start with a YAML frontmatter block".to_string());
    }

    let str = &src[OPEN.len()..];
    // gray-matter looks for the literal `\n---`.
    let close = "\n---";
    let close_index = match str.find(close) {
        Some(i) => i,
        // No closing delimiter: the whole rest of the file is YAML.
        None => str.len(),
    };

    let raw_yaml = &str[..close_index];
    let body = if close_index == str.len() {
        String::new()
    } else {
        let mut b = &str[close_index + close.len()..];
        if b.starts_with('\r') {
            b = &b[1..];
        }
        if b.starts_with('\n') {
            b = &b[1..];
        }
        b.to_string()
    };

    // gray-matter does NOT strip comments. It hands the block straight to
    // js-yaml, which treats `#` as a comment only at the YAML structural
    // level -- never inside a block scalar. A `## Heading` line inside a
    // `content: |-` block is ordinary content and must survive.
    let block: String = raw_yaml.to_string();

    if block.trim().is_empty() {
        return Err("frontmatter block is empty".to_string());
    }
    Ok((block, body))
}

/// Find the raw `date:` scalar and whether it was quoted.
///
/// `js-yaml` turns an unquoted ISO timestamp into a Date object, which
/// the Next.js render then surfaces as `[object Object]` in the
/// `article:published_time` meta tag, while a quoted date stays a plain
/// string. Reading the raw line is the only way to tell the two apart
/// after the fact, so it is captured here while the YAML is still text.
pub fn raw_date_scalar(yaml: &str) -> Option<(String, bool)> {
    for line in yaml.lines() {
        let trimmed = line.trim_start();
        // Only top-level keys (no indentation) count.
        if trimmed.len() == line.len() && trimmed.starts_with("date:") {
            let value = trimmed["date:".len()..].trim();
            if value.is_empty() {
                return None;
            }
            let quoted = (value.starts_with('\'') && value.ends_with('\'') && value.len() >= 2)
                || (value.starts_with('"') && value.ends_with('"') && value.len() >= 2);
            let unquoted = value.trim_matches(|c| c == '\'' || c == '"');
            return Some((unquoted.to_string(), quoted));
        }
    }
    None
}

/// Parse one MDX file into a `Post`.
pub fn parse_post(src: &str) -> Result<Post, String> {
    let (yaml, _body) = split_frontmatter(src)?;
    let mut post: Post =
        serde_yaml::from_str(&yaml).map_err(|e| format!("invalid frontmatter: {e}"))?;
    // `serde_yaml` keeps unquoted timestamps as strings; `js-yaml` would
    // have made them Date objects. Record which it was.
    post.date_is_quoted = match raw_date_scalar(&yaml) {
        Some((_, quoted)) => quoted,
        None => true,
    };
    Ok(post)
}

/// Normalise a date to the ISO-8601 form `JSON.stringify` produces for a
/// JavaScript Date: `YYYY-MM-DDTHH:MM:SS.sssZ`.
///
/// The unquoted timestamps in the content are already written in exactly
/// that form, so this is a normalisation rather than a conversion. A
/// bare `YYYY-MM-DD` is treated as midnight UTC.
pub fn iso_with_millis(raw: &str) -> String {
    let date_part = raw.get(0..10).unwrap_or(raw);
    if raw.len() > 10 && (raw.as_bytes()[10] == b'T' || raw.as_bytes()[10] == b't') {
        // Already a full timestamp. Pad the fractional part to three
        // digits and normalise the zone to `Z` if it is already UTC.
        let time = &raw[11..];
        let (frac, zone) = match time.find('.') {
            Some(dot) => {
                let rest = &time[dot + 1..];
                let end = rest
                    .find(|c: char| !c.is_ascii_digit())
                    .unwrap_or(rest.len());
                (&rest[..end], &rest[end..])
            }
            None => ("", time),
        };
        let mut frac = frac.to_string();
        while frac.len() < 3 {
            frac.push('0');
        }
        frac.truncate(3);
        if zone == "Z" || zone == "z" || zone.is_empty() {
            return format!(
                "{date_part}T{}.{frac}Z",
                &time[..time.find('.').unwrap_or(time.len())]
            );
        }
        // A non-UTC offset: convert to UTC.
        return format!(
            "{date_part}T{}.{frac}{zone}",
            &time[..time.find('.').unwrap_or(time.len())]
        );
    }
    format!("{date_part}T00:00:00.000Z")
}
