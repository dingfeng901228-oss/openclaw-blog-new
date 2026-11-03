#!/usr/bin/env bash
#
# Run the Pages build in a Linux container.
#
# The Cloudflare Pages build image is Ubuntu 22.04, and whether it
# ships gcc is not documented. `build-pages.sh` falls back to
# rustup's bundled rust-lld when there is no system linker, and that
# fallback has to be tested on its own -- the normal container has
# gcc, so it never reaches it.
#
#   ./rust/build-linux-container.sh              # with a C compiler
#   ./rust/build-linux-container.sh --no-cc      # without one
#
# Usage: ./rust/build-linux-container.sh [repo-root]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
LOG="${TMPDIR:-/tmp}/frankbot-rs-linux-build.log"

# The container writes the result to a second mount, so the output
# can be compared with the local build. Docker on Windows needs a
# native path for the mount source, not an MSYS one.
HOST_OUT="$REPO/out-docker"
rm -rf "$HOST_OUT"
mkdir -p "$HOST_OUT"
HOST_OUT="$(cd "$HOST_OUT" && pwd -W)"

# --no-cc removes the C compiler, to exercise the musl-hosted
# toolchain fallback.
#
# The musl package is still needed: the musl toolchain's binaries are
# linked against /lib/ld-musl-x86_64.so.1, and the glibc-only image
# does not have that loader. It is a runtime loader, not a compiler,
# so the fallback still proves that no C toolchain is needed.
NO_CC=0
for arg in "$@"; do
  [ "$arg" = "--no-cc" ] && NO_CC=1
done

if [ "$NO_CC" = "1" ]; then
  IMAGE="ubuntu:22.04"
  SETUP='
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq --no-install-recommends ca-certificates curl git musl
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
    apt-get install -y -qq --no-install-recommends nodejs
  '
else
  IMAGE="node:22-bookworm"
  SETUP=""
fi

docker run --rm \
  -v "$REPO:/src:ro" \
  -v "$HOST_OUT:/host-out" \
  "$IMAGE" \
  bash -c "
    set -euo pipefail
    $SETUP

    mkdir -p /work
    # The excludes have to match at any depth. The repository root
    # still has a stale my-blog/ directory with its own
    # node_modules, .next and out, and copying 36,000 files off a
    # Windows filesystem is slow enough to look hung.
    tar -C /src --exclude=node_modules --exclude=.next \
        --exclude=out --exclude=out-rs --exclude=out-docker \
        --exclude=target --exclude=.git --exclude=.mdx-backups \
        -cf - . | tar -C /work -xf -
    cd /work

    echo '=== node / npm ==='
    node --version
    npm --version
    echo '=== the C compiler ==='
    if command -v cc >/dev/null 2>&1; then
      echo 'cc: present'
    else
      echo 'cc: ABSENT -- the rust-lld fallback will be used'
    fi

    echo '=== the build ==='
    chmod +x rust/build-pages.sh
    ./rust/build-pages.sh /work /work/out-docker

    echo '=== the result ==='
    echo -n 'html files   : '
    find out-docker -name '*.html' | wc -l
    echo -n 'footer hash  : '
    grep -o 'jsx-[a-f0-9]\{16\}' out-docker/en.html | head -1
    echo -n 'woff2 files  : '
    ls out-docker/_next/static/media/*.woff2 2>/dev/null | wc -l

    # Copy the result back so it can be compared with the local
    # build. The repository is mounted read-only, so the output goes
    # to a second mount.
    echo '=== copying the output back ==='
    cp -a out-docker/. /host-out/
    echo 'copied'
  " 2>&1 | tee "$LOG"

echo
echo "log -> $LOG"
echo "output -> $HOST_OUT"
