#!/bin/bash
# Initial setup script for CalendarSync
# Run this once to create config files and authenticate

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=== CalendarSync Setup ==="
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "# CalendarSync Environment Variables" > .env
    echo "" >> .env

    # Generate a random encryption key
    RANDOM_KEY=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    echo "CALENDARSYNC_ENCRYPTION_KEY=$RANDOM_KEY" >> .env
    echo "TZ=UTC" >> .env

    echo "Created .env with generated encryption key"
    echo "IMPORTANT: Back up your .env file - you'll need the key to decrypt auth tokens"
    echo ""
else
    echo ".env file already exists"
fi

# Check for config files
if [ ! -f config/sync-a-to-b.yaml ]; then
    if [ -f config/sync-a-to-b.yaml.example ]; then
        echo ""
        echo "Config file not found. Creating from example..."
        cp config/sync-a-to-b.yaml.example config/sync-a-to-b.yaml
        echo "Created config/sync-a-to-b.yaml"
        echo ">>> Please edit this file with your Google OAuth credentials and calendar IDs <<<"
    fi
fi

if [ ! -f config/sync-b-to-a.yaml ]; then
    if [ -f config/sync-b-to-a.yaml.example ]; then
        cp config/sync-b-to-a.yaml.example config/sync-b-to-a.yaml
        echo "Created config/sync-b-to-a.yaml"
        echo ">>> Please edit this file with your Google OAuth credentials and calendar IDs <<<"
    fi
fi

# Create data directory
mkdir -p data

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Edit config/sync-a-to-b.yaml and config/sync-b-to-a.yaml"
echo "   - Add your Google OAuth Client ID and Secret"
echo "   - Set your calendar IDs"
echo ""
echo "2. Build the Docker image:"
echo "   docker compose build"
echo ""
echo "3. Authenticate (do this for each config file):"
echo "   docker compose run --rm auth"
echo "   (This will open a browser for Google OAuth)"
echo ""
echo "4. Test the sync:"
echo "   docker compose run --rm sync-all"
echo ""
echo "5. Set up scheduled runs (see README for cron/systemd examples)"
echo ""
