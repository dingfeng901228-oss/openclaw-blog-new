//! File reading that tolerates the encodings the content directory
//! actually contains.
//!
//! One post in the repo is stored as UTF-16LE with a BOM. The Next.js
//! build reads it with `fs.readFileSync(filePath, 'utf-8')`, which
//! produces mojibake; `gray-matter` then fails to find the frontmatter
//! delimiters, so the post ends up with no usable content and is
//! skipped (it is a draft). The Rust build decodes the file properly,
//! which yields the same outcome -- the post is a draft and gets no
//! pages -- without the decode error.

/// Decode a byte slice that may be UTF-8 (with or without BOM) or
/// UTF-16 (LE or BE, with BOM).
pub fn decode(bytes: &[u8]) -> Result<String, String> {
    if bytes.starts_with(&[0xFF, 0xFE]) {
        return decode_utf16(&bytes[2..], true);
    }
    if bytes.starts_with(&[0xFE, 0xFF]) {
        return decode_utf16(&bytes[2..], false);
    }
    let body = if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        &bytes[3..]
    } else {
        bytes
    };
    match std::str::from_utf8(body) {
        Ok(s) => Ok(s.to_string()),
        Err(e) => Err(format!("not valid UTF-8: {e}")),
    }
}

fn decode_utf16(bytes: &[u8], little_endian: bool) -> Result<String, String> {
    if !bytes.len().is_multiple_of(2) {
        return Err("UTF-16 byte length is not even".to_string());
    }
    let units: Vec<u16> = bytes
        .as_chunks::<2>()
        .0
        .iter()
        .map(|c| {
            if little_endian {
                u16::from_le_bytes([c[0], c[1]])
            } else {
                u16::from_be_bytes([c[0], c[1]])
            }
        })
        .collect();
    String::from_utf16(&units).map_err(|e| format!("invalid UTF-16: {e}"))
}
