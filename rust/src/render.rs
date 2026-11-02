//! Markdown -> HTML rendering.
//!
//! This is a faithful port of `convertMarkdown()` from the live Next.js
//! source (`src/app/[locale]/blog/[slug]/page.tsx`). The deployed site
//! does NOT use remark/rehype -- it uses a chain of regex replacements.
//! Reproducing that chain exactly is what keeps the Rust output
//! byte-identical to what production serves today.
//!
//! The chain, in order:
//!
//! 1. Fenced code blocks are pulled out first and replaced by
//!    `%%CODEBLOCK_N%%` placeholders, so later regexes cannot corrupt
//!    their contents. They are restored at the very end.
//! 2. Headings (`###`, `##`, `#`), strong (`**`), emphasis (`*`),
//!    inline code, images, links, list items, ordered list items and
//!    blockquotes are rewritten with the site's Tailwind classes.
//! 3. Blank lines become paragraph boundaries; remaining newlines
//!    become `<br />`.
//!
//! Two JS-specific behaviours are reproduced deliberately:
//!
//! * `String.replace` with a `$1` in the replacement string substitutes
//!   the capture group. The replacement templates below contain no bare
//!   `$`, and captured content is inserted verbatim (the `regex` crate's
//!   `replace_all` with a closure does the same).
//! * The heading regexes use the `m` flag so `$` matches at a line end,
//!   while `.` does not match a newline. `regex` gives us the same via
//!   `(?m)` and by default `.` excludes `\n`.

use regex::{Captures, Regex};

fn regexes() -> &'static Regexes {
    use std::sync::OnceLock;
    static CELL: OnceLock<Regexes> = OnceLock::new();
    CELL.get_or_init(|| Regexes {
        code_block: Regex::new(r"(?s)```(\w+)?\n(.*?)```").unwrap(),
        h3: Regex::new(r"(?m)^### (.*)$").unwrap(),
        h2: Regex::new(r"(?m)^## (.*)$").unwrap(),
        h1: Regex::new(r"(?m)^# (.*)$").unwrap(),
        strong: Regex::new(r"\*\*(.*?)\*\*").unwrap(),
        em: Regex::new(r"\*(.*?)\*").unwrap(),
        inline_code: Regex::new(r"`([^`]+)`").unwrap(),
        image: Regex::new(r"!\[([^\]]*)\]\(([^)]+)\)").unwrap(),
        link: Regex::new(r"\[([^\]]+)\]\(([^)]+)\)").unwrap(),
        ul_item: Regex::new(r"(?m)^- (.*)$").unwrap(),
        ol_item: Regex::new(r"(?m)^(\d+)\. (.*)$").unwrap(),
        quote: Regex::new(r"(?m)^> (.*)$").unwrap(),
    })
}

/// The compiled patterns.
///
/// These mirror the JavaScript patterns in `convertMarkdown()` exactly.
/// The one subtlety: in JavaScript, `.` never matches a newline, so the
/// patterns below deliberately do NOT set the `s` flag. A dotall
/// `strong`/`em` pattern would happily span a paragraph break and
/// swallow the heading tags in between.
struct Regexes {
    code_block: Regex,
    h3: Regex,
    h2: Regex,
    h1: Regex,
    strong: Regex,
    em: Regex,
    inline_code: Regex,
    image: Regex,
    link: Regex,
    ul_item: Regex,
    ol_item: Regex,
    quote: Regex,
}

/// Render markdown exactly the way the Next.js site does.
pub fn render(markdown: &str) -> String {
    let re = regexes();

    // --- 1. pull out code blocks -----------------------------------------
    let mut code_blocks: Vec<String> = Vec::new();
    let mut processed = re
        .code_block
        .replace_all(markdown, |caps: &Captures<'_>| {
            let code = &caps[2];
            let escaped = escape_code(code);
            let index = code_blocks.len();
            code_blocks.push(format!(
                "<pre class=\"bg-bg-tertiary rounded-lg p-4 my-6 overflow-x-auto border border-border\"><code class=\"text-sm text-text-secondary font-mono\">{}</code></pre>",
                escaped.replace('\n', "<br />")
            ));
            format!("%%CODEBLOCK_{index}%%")
        })
        .into_owned();

    // --- 2. markdown transformations --------------------------------------
    processed = re
        .h3
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<h3 class=\"text-xl font-semibold text-text-primary mt-8 mb-4\">{}</h3>",
                &c[1]
            )
        })
        .into_owned();
    processed = re
        .h2
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<h2 class=\"text-2xl font-semibold text-text-primary mt-10 mb-4\">{}</h2>",
                &c[1]
            )
        })
        .into_owned();
    processed = re
        .h1
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<h1 class=\"text-3xl font-bold text-text-primary mt-10 mb-6\">{}</h1>",
                &c[1]
            )
        })
        .into_owned();
    processed = re
        .strong
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<strong class=\"font-semibold text-text-primary\">{}</strong>",
                &c[1]
            )
        })
        .into_owned();
    processed = re
        .em
        .replace_all(&processed, |c: &Captures| {
            format!("<em class=\"italic\">{}</em>", &c[1])
        })
        .into_owned();
    processed = re
        .inline_code
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<code class=\"bg-bg-tertiary px-1.5 py-0.5 rounded text-text-primary text-sm font-mono\">{}</code>",
                &c[1]
            )
        })
        .into_owned();
    processed = re
        .image
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<img src=\"{}\" alt=\"{}\" class=\"rounded-lg my-6 w-full\" loading=\"lazy\" />",
                &c[2], &c[1]
            )
        })
        .into_owned();
    processed = re
        .link
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<a href=\"{}\" class=\"text-text-primary hover:underline\" target=\"_blank\" rel=\"noopener\">{}</a>",
                &c[2], &c[1]
            )
        })
        .into_owned();
    processed = re
        .ul_item
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<li class=\"ml-6 text-text-secondary list-disc marker:text-text-primary\">{}</li>",
                &c[1]
            )
        })
        .into_owned();
    processed = re
        .ol_item
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<li class=\"ml-6 text-text-secondary list-decimal marker:text-text-primary\">{}</li>",
                &c[2]
            )
        })
        .into_owned();
    processed = re
        .quote
        .replace_all(&processed, |c: &Captures| {
            format!(
                "<blockquote class=\"border-l-4 border-border-hover pl-4 my-4 text-text-secondary italic\">{}</blockquote>",
                &c[1]
            )
        })
        .into_owned();

    // --- 3. paragraph breaks and line breaks ------------------------------
    processed = processed.replace(
        "\n\n",
        "</p><p class=\"text-text-secondary leading-relaxed my-4\">",
    );
    processed = processed.replace('\n', "<br />");

    // --- 4. restore code blocks --------------------------------------------
    for (i, block) in code_blocks.iter().enumerate() {
        processed = processed.replace(&format!("%%CODEBLOCK_{i}%%"), block);
    }

    processed
}

/// Escape the contents of a fenced code block, matching the JS order:
/// `&` first, then `<`, then `>`.
fn escape_code(code: &str) -> String {
    code.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// Escape text for HTML body context.
pub fn escape_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#x27;"),
            _ => out.push(c),
        }
    }
    out
}

/// Escape for an HTML attribute value.
pub fn escape_attr(s: &str) -> String {
    escape_html(s)
}

/// Escape a string for use inside a JSON string literal.
///
/// This matches JavaScript's `JSON.stringify` exactly, because the live
/// site emits its JSON-LD with `JSON.stringify(blogPostingJsonLd)`.
/// Notably `JSON.stringify` does **not** escape `<`, `>` or `&` -- only
/// the quote, the backslash and the control characters.
pub fn escape_json(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            '\u{08}' => out.push_str("\\b"),
            '\u{0c}' => out.push_str("\\f"),
            c if (c as u32) < 0x20 => {
                out.push_str(&format!("\\u{:04x}", c as u32));
            }
            _ => out.push(c),
        }
    }
    out
}

/// A JSON string, quotes included.
///
/// `escape_json` escapes the *contents* of a string; this wraps it in
/// quotes so it can be used directly in a JSON document.
pub fn json_string(s: &str) -> String {
    format!("\"{}\"", escape_json(s))
}
