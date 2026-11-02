#!/usr/bin/env bash
#
# Report the build environment of the Cloudflare Pages image.
#
# The Pages build log is only visible in the Cloudflare dashboard and
# the API does not return it, so the environment has to be measured
# from inside the build. This script writes what it finds into the
# output directory, which Pages then deploys, and it always exits 0.
#
# The build command of the Pages project is set to this script while
# the environment is being established. It is not part of the site
# build.
#
# Usage: ./rust/env-report.sh [out-dir]

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
OUT="${1:-$REPO/out-rs}"

mkdir -p "$OUT"
REPORT="$OUT/env-report.txt"

{
  echo "environment report"
  echo "at $(date -u +%FT%TZ)"
  echo
  echo "--- uname ---"
  uname -a
  echo
  echo "--- the C toolchain ---"
  for c in cc gcc g++ ld make cmake ar; do
    printf '  %-6s %s\n' "$c" "$(command -v "$c" || echo MISSING)"
  done
  echo
  echo "--- the language runtimes ---"
  for c in node npm npx python3 ruby go php cargo rustc rustup curl wget tar git; do
    printf '  %-8s %s\n' "$c" "$(command -v "$c" || echo MISSING)"
  done
  echo
  echo "  node    $(node --version 2>/dev/null || echo MISSING)"
  echo "  npm     $(npm --version 2>/dev/null || echo MISSING)"
  echo
  echo "--- disk ---"
  df -h . 2>/dev/null
  echo
  echo "--- memory ---"
  free -h 2>/dev/null || cat /proc/meminfo 2>/dev/null | head -3
  echo
  echo "--- the environment variables ---"
  # The prefixes are matched with a trailing dot, not "=": "NODE_="
  # would only match a variable literally called "NODE_", and
  # NODE_VERSION would be missed.
  env | grep -E "^(HOME|PATH|USER|CI|CF_|NODE_|SKIP_|NPM_|PWD|SHELL)[A-Z_]*=" | sort
  echo
  echo "--- the repository ---"
  echo "  pwd:     $(pwd)"
  echo "  files:   $(ls -1 | head -20 | tr '\n' ' ')"
  echo "  rust/:   $(ls -1 rust 2>/dev/null | tr '\n' ' ')"
} > "$REPORT" 2>&1

# The Pages build needs an index.html to deploy something.
echo "<!doctype html><title>env report</title><pre>$(cat "$REPORT")</pre>" > "$OUT/index.html"

cat "$REPORT"
exit 0
