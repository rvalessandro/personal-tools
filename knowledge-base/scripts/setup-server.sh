#!/bin/bash
# Run this on the server to set up auto-sync
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

chmod +x "$SCRIPT_DIR/autocommit.sh"

# Install systemd timer (user-level)
mkdir -p ~/.config/systemd/user
cp "$SCRIPT_DIR/kb-sync.service" ~/.config/systemd/user/
cp "$SCRIPT_DIR/kb-sync.timer" ~/.config/systemd/user/

systemctl --user daemon-reload
systemctl --user enable kb-sync.timer
systemctl --user start kb-sync.timer

echo "Done. Check status: systemctl --user status kb-sync.timer"
