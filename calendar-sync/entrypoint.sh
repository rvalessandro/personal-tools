#!/bin/sh
set -e

# Write cron job with actual env var value
echo "*/15 * * * * CALENDARSYNC_ENCRYPTION_KEY='$CALENDARSYNC_ENCRYPTION_KEY' /usr/local/bin/calendarsync --config /app/config/systeric-to-laku6.yaml >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

# Run initial sync
echo "Running initial sync..."
/usr/local/bin/calendarsync --config /app/config/systeric-to-laku6.yaml || true

echo "Starting cron (syncs every 15 minutes)..."
exec crond -f -l 2
