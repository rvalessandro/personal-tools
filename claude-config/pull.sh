#!/bin/bash
# Pull Claude config from ~/.claude into this repo
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
CLAUDE_JSON="$HOME/.claude.json"

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

# Pull MCP servers from ~/.claude.json
# Try current repo first, then fall back to $HOME
if [ -f "$CLAUDE_JSON" ] && command -v jq &> /dev/null; then
  echo "Pulling MCP servers..."
  REPO_DIR="$(dirname "$SCRIPT_DIR")"

  # Try repo project first
  MCP_SERVERS=$(jq --arg repo "$REPO_DIR" '.projects[$repo].mcpServers // {}' "$CLAUDE_JSON")

  # Fall back to $HOME if repo has no servers
  if [ "$MCP_SERVERS" = "{}" ] || [ "$MCP_SERVERS" = "null" ]; then
    MCP_SERVERS=$(jq --arg home "$HOME" '.projects[$home].mcpServers // {}' "$CLAUDE_JSON")
  fi

  if [ "$MCP_SERVERS" != "{}" ] && [ "$MCP_SERVERS" != "null" ]; then
    echo "$MCP_SERVERS" > "$SCRIPT_DIR/mcpServers.json"
    echo "  -> mcpServers.json updated"
  else
    echo "  -> No MCP servers found"
  fi
fi

echo ""
echo "=== Done ==="
echo "Review changes with: git diff"
echo "Commit with: git add -A && git commit -m 'Update Claude config'"
