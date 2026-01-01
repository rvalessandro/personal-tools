#!/bin/bash
# Auto-commit knowledge-base changes
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KB_DIR="$(dirname "$SCRIPT_DIR")"
REPO_DIR="$(dirname "$KB_DIR")"

cd "$REPO_DIR"

# Ensure correct ownership (fixes sudo git issues)
CURRENT_USER="${SUDO_USER:-$USER}"
if [[ -n "$CURRENT_USER" && "$CURRENT_USER" != "root" ]]; then
    chown -R "$CURRENT_USER:$CURRENT_USER" "$KB_DIR" 2>/dev/null || true
fi

# Pull first
git pull --rebase 2>/dev/null || git rebase --abort 2>/dev/null || true

# Check for kb changes
if [[ -n $(git status --porcelain knowledge-base) ]]; then
    git add knowledge-base
    git commit -m "kb: $(date '+%Y-%m-%d %H:%M')"
    git push
    echo "[$(date)] Synced"
else
    echo "[$(date)] No changes"
fi
