# Calendar Cross-Blocking

Dockerized setup for [CalendarSync](https://github.com/inovex/CalendarSync) to create cross-blocking between Google Calendars. When you have an event on one calendar, a "busy" blocker event is created on the other calendar.

Similar to [Reclaim.ai](https://reclaim.ai/features/calendar-sync) calendar sync, but self-hosted.

## How It Works

```
Systeric Calendar                Laku6 Calendar
┌─────────────────┐             ┌─────────────────┐
│ Meeting 10-11am │ ──────────► │ Busy (Synced)   │
│                 │             │ 10-11am         │
└─────────────────┘             └─────────────────┘
```

CalendarSync runs periodically, syncing events from Systeric to Laku6 as "busy" blocker events.

## Prerequisites

- Docker and Docker Compose (for server deployment)
- Google Cloud project with Calendar API enabled
- Google OAuth credentials (**Desktop app** type)

## Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project (or select existing)

3. **Enable the Google Calendar API**:
   - Navigate to **APIs & Services > Library**
   - Search for "Google Calendar API"
   - Click **Enable**

4. **Configure OAuth consent screen**:
   - Go to **APIs & Services > OAuth consent screen**
   - Choose **External** (or Internal if using Google Workspace)
   - Fill in required fields:
     - App name: `CalendarSync`
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue**
   - On Scopes page, click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/calendar`
   - Save and continue through remaining steps

5. **Add test users** (required while app is in testing mode):
   - Go to **OAuth consent screen > Test users**
   - Add all Google accounts you'll sync (e.g., `andro@systeric.com`, `andro@laku6.com`)

6. **Create OAuth credentials**:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - **IMPORTANT: Application type: Desktop app** (NOT Web application)
   - Name: `CalendarSync`
   - Click **Create**
   - **Save the Client ID and Client Secret**

   > **Why Desktop app?** CalendarSync uses a dynamic localhost port for OAuth callback. Desktop app credentials allow any localhost port, while Web application credentials require a specific redirect URI.

### 2. Configure CalendarSync

```bash
cd calendar-sync

# Run setup script (creates .env and config files)
./scripts/setup.sh

# Edit config with your credentials
nano config/systeric-to-laku6.yaml
```

Update the config with your OAuth credentials:
```yaml
source:
  adapter:
    type: google
    calendar: "andro@systeric.com"
    oAuth:
      clientId: "YOUR_CLIENT_ID.apps.googleusercontent.com"
      clientKey: "YOUR_CLIENT_SECRET"

sink:
  adapter:
    type: google
    calendar: "andro@laku6.com"
    oAuth:
      clientId: "YOUR_CLIENT_ID.apps.googleusercontent.com"
      clientKey: "YOUR_CLIENT_SECRET"
```

### 3. Run Locally (macOS/Linux)

```bash
# Download binary (macOS ARM)
curl -sL https://github.com/inovex/CalendarSync/releases/download/v0.10.1/CalendarSync_0.10.1_darwin_arm64.tar.gz | tar xz
mv CalendarSync calendarsync

# Run (first time will open browser for OAuth)
CALENDARSYNC_ENCRYPTION_KEY=$(grep CALENDARSYNC_ENCRYPTION_KEY .env | cut -d= -f2) ./calendarsync --config config/systeric-to-laku6.yaml
```

**Authentication flow:**
1. CalendarSync opens your browser
2. Sign in with the Google account that owns the source calendar
3. Grant calendar access
4. Sign in again for the sink calendar (if different account)
5. Tokens are saved encrypted in `data/auth-storage.yaml`

### 4. Run with Docker

```bash
# Build
docker compose build

# Authenticate (interactive)
docker compose run --rm auth

# Run sync
docker compose run --rm sync

# Clean synced events
docker compose run --rm clean
```

### 5. Schedule Regular Syncs

#### Cron (simplest)

```bash
crontab -e

# Add: sync every 15 minutes
*/15 * * * * cd /path/to/calendar-sync && CALENDARSYNC_ENCRYPTION_KEY=your-key ./calendarsync --config config/systeric-to-laku6.yaml >> /var/log/calendarsync.log 2>&1
```

#### Systemd Timer (Linux servers)

Create `/etc/systemd/system/calendarsync.service`:
```ini
[Unit]
Description=CalendarSync
After=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/path/to/calendar-sync
Environment=CALENDARSYNC_ENCRYPTION_KEY=your-key
ExecStart=/path/to/calendar-sync/calendarsync --config config/systeric-to-laku6.yaml
```

Create `/etc/systemd/system/calendarsync.timer`:
```ini
[Unit]
Description=Run CalendarSync every 15 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=15min
Persistent=true

[Install]
WantedBy=timers.target
```

Enable:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now calendarsync.timer
```

## Configuration Reference

### Sync Window

Only `MonthStart` and `MonthEnd` are supported:

```yaml
sync:
  start:
    identifier: MonthStart
    offset: 0           # current month
  end:
    identifier: MonthEnd
    offset: 0           # end of current month
```

### Transformations

| Transformer | Description |
|-------------|-------------|
| `KeepTitle` | Copy original event title |
| `ReplaceTitle` | Replace with custom text (e.g., "Busy") |
| `PrefixTitle` | Add prefix to title |
| `KeepLocation` | Copy location |
| `KeepDescription` | Copy description |
| `KeepReminders` | Copy reminder settings |

### Filters

| Filter | Description |
|--------|-------------|
| `DeclinedEvents` | Skip events you've declined |
| `AllDayEvents` | Skip all-day events |
| `RegexTitle` | Skip events matching regex |
| `TimeFrame` | Only sync within time window |

## Files

```
calendar-sync/
├── config/
│   ├── systeric-to-laku6.yaml          # Your config (gitignored)
│   └── systeric-to-laku6.yaml.example  # Template
├── data/                                # Auth tokens (gitignored)
├── scripts/
│   ├── setup.sh                        # Initial setup
│   └── fix-transparency.gs             # Google Apps Script (see below)
├── .env                                 # Encryption key (gitignored)
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json                        # pnpm scripts
└── README.md
```

## Fix: Notion Calendar Not Combining Events

CalendarSync doesn't set event transparency to "opaque", so synced events show as "free" instead of "busy". This prevents Notion Calendar from combining overlapping events.

**Solution**: Use the Google Apps Script in `scripts/fix-transparency.gs`:

1. Go to [script.google.com](https://script.google.com)
2. Create new project, paste the script
3. Click **Services** (+) → Add **Google Calendar API**
4. Run `fixSyncedEventTransparency()`
5. (Optional) Run `createTrigger()` to automate every 30 minutes

## Troubleshooting

### Synced events not combining in Notion Calendar
Events show as "free" instead of "busy". Use the `fix-transparency.gs` script above.

### "redirect_uri_mismatch" error
Your OAuth credentials are **Web application** type. Delete and recreate as **Desktop app** type.

### "Token has been revoked"
Re-run the sync command to re-authenticate.

### Events not syncing
- Check calendar IDs are correct
- Verify OAuth app has calendar scope
- Check sync window (MonthStart/MonthEnd)
- Ensure test users are added in Google Cloud Console

## Additional Scripts

### Get Today's Calendar Events

```bash
# First run requires OAuth (opens browser)
node scripts/get-today-events.js

# With specific calendar
node scripts/get-today-events.js --calendar=you@example.com
```

Returns JSON with today's events including times, titles, and meeting links.

### Email Categorization

```bash
# Get categorized emails (requires Gmail API scope)
node scripts/get-emails.js

# Unread only
node scripts/get-emails.js --unread-only --limit=30
```

Returns emails categorized as:
- **needs-reply**: Personal emails requiring response
- **fyi**: Informational emails
- **newsletter**: Subscribed content
- **unsubscribe**: Promotional/automated emails

**Setup for Gmail:** Add Gmail API scope to your OAuth consent screen:
1. Go to Google Cloud Console > APIs & Services > OAuth consent screen
2. Edit app > Add scope: `https://www.googleapis.com/auth/gmail.readonly`
3. Also enable "Gmail API" in APIs & Services > Library

## References

- [CalendarSync GitHub](https://github.com/inovex/CalendarSync)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Gmail API](https://developers.google.com/gmail/api)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
