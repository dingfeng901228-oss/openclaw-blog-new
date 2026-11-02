#!/usr/bin/env bash
#
# Cloudflare Pages build for frankbot.org.
#
# The Pages build image (v3, Ubuntu 22.04) ships Node, Python, Go, Ruby
# and Bun -- but NOT Rust. So this script installs the toolchain with
# rustup before building.
#
# It also does NOT run the Next.js build. The self-hosted font CSS and
# the 232 woff2 subsets are vendored under rust/assets/, so the whole
# npm dependency tree is out of the build. That is the point of the
# Rust rewrite: the Pages build must not need node_modules.
#
# Output: ./out-rs  (the Pages "output directory" setting).
#
# Usage: ./rust/build-pages.sh [project-root] [out-dir]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
PROJECT="${1:-$REPO}"
OUT="${2:-$REPO/out-rs}"

# The toolchain channel comes from rust-toolchain.toml, so the file is
# the single source of truth.
RUST_CHANNEL="$(sed -n 's/^channel *= *"\(.*\)"/\1/p' "$HERE/rust-toolchain.toml" | head -1)"
: "${RUST_CHANNEL:=stable}"

echo "==> 1/4 rust toolchain ($RUST_CHANNEL)"
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --no-modify-path --profile minimal --default-toolchain "$RUST_CHANNEL"
fi
# shellcheck disable=SC1091
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"
export PATH="$HOME/.cargo/bin:$PATH"
cargo --version
rustc --version

echo "==> 2/4 tailwind css"
# The Tailwind CLI is the only npm package the build needs. It is
# installed into a scratch prefix rather than into the project, so no
# package.json / node_modules is required and a developer's local
# node_modules cannot shadow the pinned version.
#
# Tailwind resolves the `content` globs relative to the working
# directory, so the run happens from the generator directory: the
# globs are `./src/**/*.rs` (the Rust templates) and
# `../src/**/*.{js,ts,jsx,tsx,mdx}` (the Next.js components).
TAILWIND_VERSION="3.4.19"
# The scratch prefix lives inside the repository rather than in
# /tmp: on Windows the npm CLI is a native program and does not
# understand an MSYS path, so a `mktemp -d` prefix would install
# somewhere npm cannot find again.
#
# The path is passed to npm in native form. On MSYS (Windows) the
# shell paths are /f/... while npm needs F:/..., so convert when
# cygpath is available.
TW_PREFIX="$HERE/.tooling"
if command -v cygpath >/dev/null 2>&1; then
  TW_PREFIX_NATIVE="$(cygpath -m "$TW_PREFIX")"
else
  TW_PREFIX_NATIVE="$TW_PREFIX"
fi
rm -rf "$TW_PREFIX"
MSYS_NO_PATHCONV=1 npm install --silent --no-audit --no-fund --prefix "$TW_PREFIX_NATIVE" \
  "tailwindcss@${TAILWIND_VERSION}" >/dev/null
cd "$HERE"

# Tailwind's own arguments are read by a native Windows binary, so
# they need native paths too. On Linux these are already native.
if command -v cygpath >/dev/null 2>&1; then
  GLOBALS_NATIVE="$(cygpath -m "$PROJECT/src/styles/globals.css")"
  CONFIG_NATIVE="$(cygpath -m "$HERE/tailwind.config.js")"
  CSS_OUT_NATIVE="$(cygpath -m "$HERE/site.css")"
else
  GLOBALS_NATIVE="$PROJECT/src/styles/globals.css"
  CONFIG_NATIVE="$HERE/tailwind.config.js"
  CSS_OUT_NATIVE="$HERE/site.css"
fi
MSYS_NO_PATHCONV=1 "$TW_PREFIX/node_modules/.bin/tailwindcss" \
  -i "$GLOBALS_NATIVE" \
  -c "$CONFIG_NATIVE" \
  -o "$CSS_OUT_NATIVE" \
  --minify
rm -rf "$TW_PREFIX"

echo "==> 3/4 cargo build"
# Linking needs a C compiler. The Pages image is not documented to
# ship one, so on Linux fall back in this order:
#   1. the system linker (cc/gcc), if the image has it
#   2. rustup's bundled rust-lld with the self-contained CRT objects,
#      which needs no system toolchain at all
# The second path is what makes the build independent of the image.
#
# On Windows the MSVC target is used instead, with rust-lld.exe as the
# linker -- configured in rust/.cargo/config.toml, so that the build
# works without a full Visual Studio install.
CARGO_TARGET_ARGS=()
case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*)
    echo "    windows: building the MSVC target with rust-lld"
    CARGO_TARGET_ARGS=(--target x86_64-pc-windows-msvc)
    ;;
  *)
    if command -v cc >/dev/null 2>&1 || command -v gcc >/dev/null 2>&1; then
      echo "    using the system linker"
    else
      echo "    no system C compiler; linking with rust-lld (self-contained)"
      export RUSTFLAGS="-C link-self-contained=+linker -C linker=rust-lld"
    fi
    ;;
esac
cargo build --release --locked "${CARGO_TARGET_ARGS[@]}"

echo "==> 4/4 generate"
# The generator clears the output directory, so the assets have to be
# copied *after* it runs.
#
# With a --target, cargo puts the binary under target/<triple>/release.
BIN="$HERE/target/release/frankbot-rs"
if [ ! -x "$BIN" ]; then
  BIN="$(find "$HERE/target" -maxdepth 3 -type f -name 'frankbot-rs*' -perm -u+x 2>/dev/null | head -1)"
fi
if [ -z "$BIN" ] || [ ! -x "$BIN" ]; then
  echo "the generator binary was not found under $HERE/target" >&2
  exit 1
fi
echo "    $BIN"
"$BIN" "$PROJECT" "$OUT"

echo "==> runtime"
# The static runtime: one dependency-free file that restores the
# behaviours the Next.js build got from React.
cp "$HERE/src/site.js" "$OUT/site.js"

echo "==> fonts"
# The self-hosted font CSS and the woff2 subsets are vendored, not
# regenerated: they are the fallback for readers who cannot reach
# Google Fonts (the @import in globals.css is the primary source).
# The names are content-hashed by next/font, so they are copied
# verbatim and the @font-face URLs keep working.
ASSETS="$HERE/assets/_next/static"
if [ -d "$ASSETS" ]; then
  mkdir -p "$OUT/_next/static/css" "$OUT/_next/static/media"
  cp "$ASSETS"/css/*.css "$OUT/_next/static/css/"
  cp "$ASSETS"/media/*.woff2 "$OUT/_next/static/media/"
fi

echo
echo "built -> $OUT"
