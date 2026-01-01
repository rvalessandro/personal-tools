#!/bin/bash
# Run this on the server to set up auto-sync via cron
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AUTOCOMMIT="$SCRIPT_DIR/autocommit.sh"

chmod +x "$AUTOCOMMIT"

# Add cron job (every 5 minutes)
CRON_JOB="*/5 * * * * $AUTOCOMMIT >> /tmp/kb-sync.log 2>&1"

# Check if already exists
if crontab -l 2>/dev/null | grep -q "autocommit.sh"; then
    echo "Cron job already exists. Updating..."
    crontab -l | grep -v "autocommit.sh" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Done. Cron job installed (every 5 min)"
echo "Check logs: tail -f /tmp/kb-sync.log"
echo "View cron: crontab -l"
