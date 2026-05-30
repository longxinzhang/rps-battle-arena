#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET="$SCRIPT_DIR/WorldRPS/Resources/world-rps"

mkdir -p "$TARGET"
rsync -a --delete --exclude='._*' \
  "$REPO_ROOT/index.html" \
  "$REPO_ROOT/css" \
  "$REPO_ROOT/js" \
  "$REPO_ROOT/assets" \
  "$TARGET/"

echo "Synced Web assets to $TARGET"

