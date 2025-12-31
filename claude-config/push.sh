#!/bin/bash
# Sync Claude config from repo to local ~/.claude
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
CLAUDE_DIR="$HOME/.claude"

echo "=== Syncing Claude Config ==="

# Load .env if exists
if [ -f "$REPO_DIR/.env" ]; then
  export $(grep -v '^#' "$REPO_DIR/.env" | xargs)
fi

# Create directories
mkdir -p "$CLAUDE_DIR/commands"

# Sync commands
echo "Syncing commands..."
cp -v "$SCRIPT_DIR/commands/"*.md "$CLAUDE_DIR/commands/" 2>/dev/null || echo "No commands to sync"

# Sync MCP servers to claude.json
if [ -f "$SCRIPT_DIR/mcpServers.json" ]; then
  echo "Syncing MCP servers..."

  CLAUDE_JSON="$HOME/.claude.json"

  # Create base claude.json if it doesn't exist
  if [ ! -f "$CLAUDE_JSON" ]; then
    echo '{"projects":{}}' > "$CLAUDE_JSON"
  fi

  # Read MCP config and merge (requires jq)
  if command -v jq &> /dev/null; then
    # Get working directory from .env or use home
    WORK_DIR="${WORKING_DIRECTORY:-$HOME}"

    # Substitute environment variables in mcpServers.json
    MCP_CONFIG=$(envsubst < "$SCRIPT_DIR/mcpServers.json")

    # Sync to WORKING_DIRECTORY, HOME, and current repo for global access
    TMP_FILE=$(mktemp)
    jq --argjson mcps "$MCP_CONFIG" \
       --arg project "$WORK_DIR" \
       --arg home "$HOME" \
       --arg repo "$REPO_DIR" \
       '.projects[$project].mcpServers = $mcps | .projects[$home].mcpServers = $mcps | .projects[$repo].mcpServers = $mcps' \
       "$CLAUDE_JSON" > "$TMP_FILE" && mv "$TMP_FILE" "$CLAUDE_JSON"

    echo "MCP servers synced for:"
    echo "  - $WORK_DIR"
    echo "  - $HOME"
    echo "  - $REPO_DIR"
  else
    echo "Warning: jq not installed. Skipping MCP server sync."
    echo "Install with: apt install jq"
  fi
fi

echo "=== Done ==="
