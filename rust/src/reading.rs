//! Reading time, ported from the `reading-time` npm package.
//!
//! The npm package counts words like this:
//!
//! * A CJK character is always a word. The ranges are Hiragana
//!   (0x3040-0x309F), CJK Unified Ideographs (0x4E00-0x9FFF), Hangul
//!   (0xAC00-0xD7A3) and CJK Extension B (0x20000-0x2EBE0). Katakana is
//!   deliberately *not* included.
//! * A non-CJK run ends a word when the next character is a word bound
//!   (space, newline, CR, tab) or a CJK character.
//! * After a CJK character, the punctuation and word bounds that follow
//!   it are swallowed, so "你好。" is one word rather than two.
//! * The rate is 200 words per minute and the displayed value is
//!   `Math.ceil(minutes.toFixed(2))`.
//!
//! Two JavaScript details are reproduced deliberately:
//!
//! * The package indexes the text by **UTF-16 code unit**, not by
//!   Unicode scalar. `text.length` and `text[i]` are code-unit based,
//!   and `charCodeAt(0)` of a single code unit is that unit's value.
//!   Astral characters therefore count as two separate units, and the
//!   CJK Extension B range can never match.
//! * The inner "eat the punctuation after a CJK character" loop
//!   advances the loop variable, so the condition is re-evaluated
//!   against the *new* next character on every iteration.

/// Is this code unit in one of the package's CJK ranges?
///
/// The Extension B range (0x20000-0x2EBE0) is unreachable in UTF-16, so
/// it is omitted here for the same reason it never matches in the
/// package.
fn is_cjk(c: u16) -> bool {
    (0x3040..=0x309F).contains(&c)      // Hiragana
        || (0x4E00..=0x9FFF).contains(&c)  // CJK Unified Ideographs
        || (0xAC00..=0xD7A3).contains(&c) // Hangul syllables
}

/// Is this character a word bound? The package uses ANSI whitespace.
fn is_word_bound(c: u16) -> bool {
    matches!(c, 0x20 | 0x0A | 0x0D | 0x09)
}

/// Is this character punctuation that gets swallowed after a CJK char?
fn is_punctuation(c: u16) -> bool {
    (0x21..=0x2F).contains(&c)
        || (0x3A..=0x40).contains(&c)
        || (0x5B..=0x60).contains(&c)
        || (0x7B..=0x7E).contains(&c)
        || (0x3000..=0x303F).contains(&c)
        || (0xFF00..=0xFFEF).contains(&c)
}

/// The number of words the npm package counts in `text`.
pub fn word_count(text: &str) -> usize {
    // The package works in UTF-16 code units.
    let units: Vec<u16> = text.encode_utf16().collect();
    if units.is_empty() {
        return 0;
    }

    // Fetch the bounds, skipping leading and trailing word bounds.
    let mut start = 0usize;
    while start < units.len() && is_word_bound(units[start]) {
        start += 1;
    }
    let mut end = units.len() as isize - 1;
    while end >= 0 && is_word_bound(units[end as usize]) {
        end -= 1;
    }
    if start > end as usize {
        return 0;
    }

    // Add a trailing word bound to make handling the edges convenient.
    let mut normalized = units;
    normalized.push(0x0A);

    let mut words = 0usize;
    let mut i = start as isize;
    while i <= end {
        let c = normalized[i as usize];
        let next = normalized[(i + 1) as usize];

        // A CJK character is always a word; a non-word-bound followed by
        // a word bound or a CJK character ends a word.
        if is_cjk(c) || (!is_word_bound(c) && (is_word_bound(next) || is_cjk(next))) {
            words += 1;
        }

        // After a CJK character, eat the punctuation and word bounds
        // that follow it. The condition is re-checked each time the
        // index advances.
        if is_cjk(c) {
            while i <= end {
                let n = normalized[(i + 1) as usize];
                if !(is_punctuation(n) || is_word_bound(n)) {
                    break;
                }
                i += 1;
            }
        }

        i += 1;
    }

    words
}

/// JavaScript's `Number.prototype.toFixed(2)`.
///
/// The spec says: find the integer `n` for which `n / 100` is closest
/// to the exact value of `x`; when two candidates are equally close,
/// pick the larger one. That is round-half-up on the exact binary value
/// of `x`, which is *not* the same as rounding `x * 100` -- the
/// multiplication introduces its own error.
///
/// The exact value is recovered by formatting with enough decimals for
/// the decision to be unambiguous. A double near `n.nn5` differs from
/// that value by at least ~1e-14, so 25 decimals is far more than
/// enough.
fn to_fixed2(x: f64) -> f64 {
    let s = format!("{:.25}", x);
    let (int_part, frac) = match s.split_once('.') {
        Some((i, f)) => (i, f),
        None => (s.as_str(), ""),
    };
    // Round at the third decimal, half up.
    let third = frac
        .as_bytes()
        .get(2)
        .map(|b| (b - b'0') as u32)
        .unwrap_or(0);
    let mut cents: u64 = frac
        .get(0..2)
        .and_then(|d| d.parse::<u64>().ok())
        .unwrap_or(0);
    if third >= 5 {
        cents += 1;
    }
    // The integer part may have been rounded up to 100.
    let whole: u64 = int_part.parse::<u64>().unwrap_or(0);
    let (whole, cents) = if cents >= 100 {
        (whole + 1, cents - 100)
    } else {
        (whole, cents)
    };
    whole as f64 + cents as f64 / 100.0
}

/// The displayed reading time, in whole minutes.
pub fn reading_minutes(text: &str) -> usize {
    let words = word_count(text);
    let minutes = words as f64 / 200.0;
    // `Math.ceil(minutes.toFixed(2))`.
    let rounded = to_fixed2(minutes);
    let ceiled = rounded.ceil();
    if ceiled < 1.0 { 0 } else { ceiled as usize }
}
