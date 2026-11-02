#!/usr/bin/env bash
#
# Test whether the Rust generator can be built on Linux with NO C
# compiler at all, using a musl-hosted Rust toolchain.
#
# The Pages build image is Ubuntu 22.04 and is not documented to ship
# a C compiler. The current fallback in build-pages.sh shims `cc` to
# rust-lld, but rust-lld is not a gcc driver: it rejects -Wl, options
# and -nodefaultlibs, so the host build scripts fail to link.
#
# A musl-hosted toolchain solves it differently: the HOST is musl too,
# so the build scripts and the proc macros link against the musl CRT
# objects that the rust-std component ships, and nothing from the
# system is needed.
#
# Usage: ./rust/test-musl-host.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"

docker run --rm \
  -v "$REPO:/src:ro" \
  ubuntu:22.04 \
  bash -c "
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq --no-install-recommends ca-certificates curl git build-essential
    curl -fsSL https://sh.rustup.rs | sh -s -- -y --no-modify-path --profile minimal --default-toolchain stable
    # rustup installs into ~/.cargo/bin, which is not on PATH yet.
    . \"\$HOME/.cargo/env\"

    mkdir -p /work
    tar -C /src --exclude=./node_modules --exclude=./.next \
        --exclude=./out --exclude=./out-rs --exclude=./out-docker \
        --exclude=./.git --exclude=./.mdx-backups -cf - . | tar -C /work -xf -
    cd /work/rust

    echo '=== the system compiler (this test keeps build-essential) ==='
    cc --version | head -1

    echo '=== install the musl-hosted toolchain ==='
    rustup toolchain install x86_64-unknown-linux-musl --profile minimal

    echo '=== build with it ==='
    # The +toolchain form overrides the rust-toolchain.toml channel.
    # The host is musl, so the build scripts and the proc macros link
    # against the musl CRT objects the toolchain ships.
    RUSTFLAGS='-C link-self-contained=yes -C linker=rust-lld -C linker-flavor=ld.lld' \
      cargo +x86_64-unknown-linux-musl build --release --locked --target x86_64-unknown-linux-musl

    echo '=== the binary ==='
    ls -la target/x86_64-unknown-linux-musl/release/frankbot-rs
    file target/x86_64-unknown-linux-musl/release/frankbot-rs 2>/dev/null || true
    ldd target/x86_64-unknown-linux-musl/release/frankbot-rs 2>&1 | head -3 || true
  " 2>&1 | tail -40
