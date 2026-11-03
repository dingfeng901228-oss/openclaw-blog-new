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
# Output: the "out" directory, which is what the repository root's
# wrangler.toml names (pages_build_output_dir = "out"). Pages reads
# that file in preference to the dashboard setting -- the build log
# shows it validating "out" and ignoring the dashboard's output
# directory -- so the Pages build has to write there.
#
# Usage: ./rust/build-pages.sh [project-root] [out-dir]
#
# Both arguments are resolved to absolute paths before the script
# changes directory, so they may be given relative to the repository
# root.
#
# The default output directory is "out-rs", NOT "out". The local
# workflow keeps the Next.js baseline in "out" and the Rust output in
# "out-rs" so the two can be compared; a build into "out" would
# overwrite the baseline and make the comparison compare the Rust
# output with itself. The Pages build passes "out" explicitly.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"

# Resolve a path against the current directory without requiring it to
# exist yet.
abspath() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *)  printf '%s/%s\n' "$PWD" "$1" ;;
  esac
}

PROJECT="$(abspath "${1:-$REPO}")"
OUT="$(abspath "${2:-$REPO/out-rs}")"

# The generator is a native binary. On Windows it cannot read the
# MSYS paths the shell uses (/f/... instead of F:/...), so the paths
# are converted before they are handed to it. On Linux they are
# already native.
PROJECT_NATIVE="$PROJECT"
OUT_NATIVE="$OUT"
if command -v cygpath >/dev/null 2>&1; then
  PROJECT_NATIVE="$(cygpath -m "$PROJECT")"
  OUT_NATIVE="$(cygpath -m "$OUT")"
fi

# Record the failing line, so the log says where it stopped.
# The log is written next to the repository, not into the output
# directory: the output directory is what gets deployed, and a build
# log does not belong on the public site.
#
# `FB_DEBUG_DEPLOY=1` copies the log into the output directory and
# makes the script exit 0, so Pages deploys the partial output and
# the log becomes reachable. It is off by default: a failed build
# must fail.
on_error() {
  local code=$?
  {
    echo "FAILED at line $LINENO: $BASH_COMMAND"
    echo "exit code: $code"
  } >> "$DIAG" 2>/dev/null || true
  if [ "${FB_DEBUG_DEPLOY:-0}" = "1" ]; then
    cp "$DIAG" "$OUT/build-log.txt" 2>/dev/null || true
    exit 0
  fi
  exit "$code"
}
trap on_error ERR

# The toolchain channel comes from rust-toolchain.toml, so the file is
# the single source of truth.
RUST_CHANNEL="$(sed -n 's/^channel *= *"\(.*\)"/\1/p' "$HERE/rust-toolchain.toml" | head -1)"
: "${RUST_CHANNEL:=stable}"

# A diagnostic log. It stays outside the output directory so that it
# is never deployed.
mkdir -p "$OUT"
DIAG="$REPO/build-log.txt"
: > "$DIAG"
diag() { echo "$*" | tee -a "$DIAG"; }
diag "build-pages.sh started at $(date -u +%FT%TZ)"
diag "uname: $(uname -srm)"
diag "project: $PROJECT"
diag "out: $OUT"
diag "HOME: $HOME"
diag "PATH has cc: $(command -v cc || echo no)"
diag "PATH has gcc: $(command -v gcc || echo no)"
diag "PATH has curl: $(command -v curl || echo no)"
diag "NODE_VERSION: ${NODE_VERSION:-unset}"
diag "SKIP_DEPENDENCY_INSTALL: ${SKIP_DEPENDENCY_INSTALL:-unset}"

diag "==> 1/4 rust toolchain ($RUST_CHANNEL)"
# rustup is installed into $HOME/.cargo/bin, but that directory is
# not always on PATH: a rustup installed with --no-modify-path does
# not write $HOME/.cargo/env either. Look there before downloading a
# second toolchain.
CARGO_BIN="$HOME/.cargo/bin"
if ! command -v cargo >/dev/null 2>&1 && [ -x "$CARGO_BIN/cargo" ]; then
  export PATH="$CARGO_BIN:$PATH"
fi
if ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --no-modify-path --profile minimal --default-toolchain "$RUST_CHANNEL"
  export PATH="$CARGO_BIN:$PATH"
fi
# shellcheck disable=SC1091
[ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"
export PATH="$CARGO_BIN:$PATH"
cargo --version
rustc --version

diag "==> 2/4 tailwind css"
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

# Tailwind resolves its browser targets through browserslist, and the
# default query ("last 2 versions") is resolved against whatever
# caniuse-lite happens to be installed. That made the generated CSS
# depend on the machine: the Windows build emitted no
# -webkit-backdrop-filter and a Linux build with an older caniuse-lite
# did, so the same source produced two different stylesheets.
#
# The targets are pinned here, as an environment variable, because
# browserslist resolves them from the directory that holds
# package.json -- the repository root -- and a config file there
# would also change the Next.js build.
export BROWSERSLIST="chrome >= 111, edge >= 111, firefox >= 111, safari >= 18, ios_saf >= 18, opera >= 97, and_chr >= 111, and_ff >= 111, and_qq >= 12, samsung >= 22"

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
diag "==> 3/4 cargo build"
# Linking needs a C compiler. The Pages v3 build image was measured
# from inside the build (rust/env-report.sh): it ships cc, gcc, ld,
# make and ar under /usr/bin, so the system linker is the normal
# path there.
#
# The fallback for an image without a C compiler is a musl-HOSTED
# Rust toolchain. The earlier attempt shimmed `cc` to rust-lld, but
# rust-lld is not a gcc driver: it rejects -Wl,... options and
# -nodefaultlibs, so the host build scripts failed to link. With a
# musl host the HOST artifacts link against the musl CRT objects the
# toolchain ships, so nothing from the system is needed at all.
#
# On Windows the MSVC target is used instead, with rust-lld.exe as the
# linker -- configured in rust/.cargo/config.toml, so that the build
# works without a full Visual Studio install.
CARGO_TARGET_ARGS=()
CARGO_TOOLCHAIN=""
case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*)
    echo "    windows: building the MSVC target with rust-lld"
    CARGO_TARGET_ARGS=(--target x86_64-pc-windows-msvc)
    ;;
  *)
    if command -v cc >/dev/null 2>&1 || command -v gcc >/dev/null 2>&1; then
      echo "    using the system linker"
    else
      echo "    no system C compiler; building with a musl-hosted toolchain"
      # The musl-hosted toolchain makes the HOST musl as well, so the
      # build scripts and the proc macros link against the musl CRT
      # objects that come with the toolchain.
      #
      # `link-self-contained=yes` is the stable spelling; the
      # `+linker` form is unstable and needs -Z unstable-options.
      # `linker-flavor=ld.lld` tells rustc to pass linker arguments
      # in the lld style instead of the gcc driver style.
      rustup toolchain install x86_64-unknown-linux-musl --profile minimal
      CARGO_TOOLCHAIN="+x86_64-unknown-linux-musl"
      CARGO_TARGET_ARGS=(--target x86_64-unknown-linux-musl)
      export RUSTFLAGS="-C link-self-contained=yes -C linker=rust-lld -C linker-flavor=ld.lld"
    fi
    ;;
esac
cargo ${CARGO_TOOLCHAIN:+$CARGO_TOOLCHAIN} build --release --locked "${CARGO_TARGET_ARGS[@]}"

diag "==> 4/4 generate"
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
"$BIN" "$PROJECT_NATIVE" "$OUT_NATIVE"

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

# The generator clears the output directory, so the diagnostic log is
# copied into it again at the end -- but only when the debug mode is
# on. A build log does not belong on the public site.
if [ "${FB_DEBUG_DEPLOY:-0}" = "1" ]; then
  {
    cat "$DIAG"
    echo "build-pages.sh finished successfully"
    echo "at $(date -u +%FT%TZ)"
  } > "$OUT/build-log.txt"
fi

echo
echo "built -> $OUT"
