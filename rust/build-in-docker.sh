#!/usr/bin/env bash
#
# Build the site in an Ubuntu 22.04 container, the same base the
# Cloudflare Pages v3 build image uses. This is what actually proves
# the Pages build works: the generator has to compile for Linux, the
# rustup install has to succeed, and the output has to match.
#
# Usage: ./rust/build-in-docker.sh [repo-root]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"

docker run --rm \
  -v "$REPO:/build" \
  -v frankbot-rs-cargo-registry:/root/.cargo/registry \
  -v frankbot-rs-cargo-git:/root/.cargo/git \
  -w /build \
  ubuntu:22.04 \
  bash -c '
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive

    # The Pages image has Node 22; install it the same way.
    apt-get update -qq
    apt-get install -y -qq --no-install-recommends ca-certificates curl git
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
    apt-get install -y -qq --no-install-recommends nodejs

    node --version
    npm --version

    chmod +x rust/build-pages.sh
    ./rust/build-pages.sh /build /build/out-docker
  '
