#!/bin/bash
# Auto-commit knowledge-base changes

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KB_DIR="$(dirname "$SCRIPT_DIR")"
REPO_DIR="$(dirname "$KB_DIR")"
CONFLICT_FILE="$KB_DIR/.sync-conflict"

# Load env for Telegram notifications
if [[ -f "$REPO_DIR/.env" ]]; then
    source "$REPO_DIR/.env"
fi

send_telegram() {
    local message="$1"
    # Use first allowed user ID for notifications
    local chat_id="${ALLOWED_USER_IDS%%,*}"
    if [[ -n "$TELEGRAM_BOT_TOKEN" && -n "$chat_id" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="$chat_id" \
            -d text="$message" \
            -d parse_mode="Markdown" > /dev/null
    fi
}

cd "$REPO_DIR"

# Ensure correct ownership (fixes sudo git issues)
CURRENT_USER="${SUDO_USER:-$USER}"
if [[ -n "$CURRENT_USER" && "$CURRENT_USER" != "root" ]]; then
    chown -R "$CURRENT_USER:$CURRENT_USER" "$KB_DIR" 2>/dev/null || true
fi

# Check if there's an unresolved conflict
if [[ -f "$CONFLICT_FILE" ]]; then
    echo "[$(date)] Conflict pending - skipping sync until resolved"
    echo "See: $CONFLICT_FILE"
    exit 0
fi

# Commit local changes first (before pull)
if [[ -n $(git status --porcelain knowledge-base) ]]; then
    git add knowledge-base
    git commit -m "kb: $(date '+%Y-%m-%d %H:%M')" || true
fi

# Try to pull
if ! git pull --rebase 2>&1; then
    # Conflict detected
    CONFLICTED_FILES=$(git diff --name-only --diff-filter=U)

    if [[ -n "$CONFLICTED_FILES" ]]; then
        # Abort the rebase to preserve state
        git rebase --abort 2>/dev/null || true

        # Write conflict report
        cat > "$CONFLICT_FILE" << EOF
SYNC CONFLICT DETECTED
======================
Time: $(date)

Conflicted files:
$CONFLICTED_FILES

Your local changes have been committed but NOT pushed.
Remote has changes that conflict with yours.

To resolve:
1. Review conflicts: git pull (will show conflicts)
2. Edit files to resolve
3. git add <files> && git rebase --continue
4. rm $CONFLICT_FILE
5. Sync will resume automatically

Or to keep your version:
  git pull --rebase -X theirs

Or to keep remote version:
  git pull --rebase -X ours
EOF

        echo "[$(date)] CONFLICT DETECTED - see $CONFLICT_FILE"

        # Send Telegram notification
        send_telegram "⚠️ *Knowledge Base Sync Conflict*

Files:
\`\`\`
$CONFLICTED_FILES
\`\`\`

Sync paused until resolved. Check server:
\`cat ~/personal-tools/knowledge-base/.sync-conflict\`"

        exit 1
    fi
fi

# Push if we have commits ahead
if git status | grep -q "Your branch is ahead"; then
    git push
    echo "[$(date)] Synced"
else
    echo "[$(date)] No changes"
fi
