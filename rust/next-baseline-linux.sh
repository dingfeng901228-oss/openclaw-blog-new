#!/usr/bin/env bash
#
# Build the Next.js baseline in a Linux container.
#
# The deployed site is built by Cloudflare Pages on Linux, so the
# Next.js output that the Rust generator has to match is the *Linux*
# build. A local Windows build differs in ways that are invisible in
# the source:
#
#   - styled-jsx hashes the text of a `<style jsx>` block to build
#     its scope class name, so CRLF and LF produce different hashes.
#   - next/font emits the font preload links and the
#     `next-size-adjust` meta tag differently.
#
# This script builds the baseline the same way Pages does, so the
# parity check compares like with like.
#
# Usage: ./rust/next-baseline-linux.sh [repo-root] [out-dir]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
PROJECT="${1:-$REPO}"
OUT="${2:-$REPO/out-linux}"

mkdir -p "$OUT"

docker run --rm \
  -v "$PROJECT:/src:ro" \
  -v "$OUT:/hostout" \
  node:22-bookworm \
  bash -c '
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive

    # Copy the source without the Windows node_modules and without
    # the build artifacts.
    mkdir -p /work
    tar -C /src --exclude=./node_modules --exclude=./.next \
        --exclude=./out --exclude=./out-rs --exclude=./out-linux \
        --exclude=./.git --exclude=./.mdx-backups -cf - . | tar -C /work -xf -
    cd /work

    npm ci --no-audit --no-fund
    npm run build

    echo "=== the Linux baseline ==="
    echo -n "footer scope hash : "
    grep -o "jsx-[a-f0-9]\{16\}" out/en.html | head -1
    echo -n "next-size-adjust  : "
    grep -c "next-size-adjust" out/en.html
    echo -n "font preloads     : "
    grep -c "rel=\"preload\".*as=\"font\"" out/en.html
    echo -n "html files        : "
    find out -name "*.html" | wc -l

    cp -r out/. /hostout/
  '

echo
echo "baseline -> $OUT"
