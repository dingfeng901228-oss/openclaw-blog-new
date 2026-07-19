#!/usr/bin/env bash
# Install the pre-push hook for my-blog.
# This hook blocks pushes that contain workspace-private files
# (SOUL.md, MEMORY.md, skills/, memory/, etc.) from being pushed
# to the public my-blog repo on new-origin.
#
# Usage:  bash tools/hooks/setup.sh
#
# After running, `git push new-origin master` from the my-blog directory
# will be guarded. Push will fail with a clear error if any forbidden
# file is in the diff.

set -e

HOOKS_DIR=".git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE="$SCRIPT_DIR/pre-push.js"
TARGET="$HOOKS_DIR/pre-push"

if [ ! -f "$SOURCE" ]; then
  echo "ERROR: $SOURCE not found"
  exit 1
fi

mkdir -p "$HOOKS_DIR"
cp "$SOURCE" "$TARGET"
chmod +x "$TARGET"

echo "Installed pre-push hook at $TARGET"
echo "Test it with:"
echo "  echo 'refs/heads/master HEAD refs/heads/master HEAD~1' | node $TARGET new-origin https://test"
