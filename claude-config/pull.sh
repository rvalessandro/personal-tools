#!/bin/bash
# Pull Claude config from ~/.claude into this repo
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"

echo "=== Pulling Claude Config into Repo ==="

# Pull commands
if [ -d "$CLAUDE_DIR/commands" ]; then
  echo "Pulling commands..."
  mkdir -p "$SCRIPT_DIR/commands"
  cp -v "$CLAUDE_DIR/commands/"*.md "$SCRIPT_DIR/commands/" 2>/dev/null || echo "No commands found"
fi

# Pull settings (excluding local overrides)
if [ -f "$CLAUDE_DIR/settings.json" ]; then
  echo "Pulling settings.json..."
  cp -v "$CLAUDE_DIR/settings.json" "$SCRIPT_DIR/settings.json"
fi

echo ""
echo "=== Done ==="
echo "Review changes with: git diff"
echo "Commit with: git add -A && git commit -m 'Update Claude config'"
