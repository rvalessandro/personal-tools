#!/bin/bash
# Minimal server setup for CalendarSync
# Run this on your server to set up the cron job

set -e

INSTALL_DIR="${1:-$HOME/calendar-sync}"

echo "=== CalendarSync Server Setup ==="
echo "Install directory: $INSTALL_DIR"
echo ""

# Create directory
mkdir -p "$INSTALL_DIR/config" "$INSTALL_DIR/data"
cd "$INSTALL_DIR"

# Download binary
echo "Downloading CalendarSync..."
curl -sL https://github.com/inovex/CalendarSync/releases/download/v0.10.1/CalendarSync_0.10.1_linux_amd64.tar.gz | tar xz
mv CalendarSync calendarsync
chmod +x calendarsync

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Copy your config file:"
echo "   scp config/systeric-to-laku6.yaml server:$INSTALL_DIR/config/"
echo ""
echo "2. Copy your auth storage (contains OAuth tokens):"
echo "   scp data/auth-storage.yaml server:$INSTALL_DIR/data/"
echo ""
echo "3. Set your encryption key in crontab:"
echo "   crontab -e"
echo ""
echo "   Add this line (sync every 15 minutes):"
echo "   */15 * * * * CALENDARSYNC_ENCRYPTION_KEY='your-key-here' $INSTALL_DIR/calendarsync --config $INSTALL_DIR/config/systeric-to-laku6.yaml >> $INSTALL_DIR/sync.log 2>&1"
echo ""
echo "4. Test it:"
echo "   CALENDARSYNC_ENCRYPTION_KEY='your-key' ./calendarsync --config config/systeric-to-laku6.yaml"
echo ""
