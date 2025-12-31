# Calendar Cross-Blocking

Dockerized setup for [CalendarSync](https://github.com/inovex/CalendarSync) to create cross-blocking between Google Calendars. When you have an event on Calendar A, a "busy" blocker event is created on Calendar B (and vice versa).

Similar to [Reclaim.ai](https://reclaim.ai/features/calendar-sync) calendar sync, but self-hosted.

## How It Works

```
Calendar A                     Calendar B
┌─────────────────┐           ┌─────────────────┐
│ Meeting 10-11am │ ────────► │ Busy (synced)   │
│                 │           │ 10-11am         │
└─────────────────┘           └─────────────────┘

┌─────────────────┐           ┌─────────────────┐
│ Busy (synced)   │ ◄──────── │ Doctor 2-3pm    │
│ 2-3pm           │           │                 │
└─────────────────┘           └─────────────────┘
```

CalendarSync runs periodically, syncing events from each calendar to the other as "busy" blocker events.

## Prerequisites

- Docker and Docker Compose
- Google Cloud project with Calendar API enabled
- Two Google Calendar accounts (or calendars) you want to sync

## Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project (or select existing)

3. Enable the Google Calendar API:
   - Navigate to **APIs & Services > Library**
   - Search for "Google Calendar API"
   - Click **Enable**

4. Configure OAuth consent screen:
   - Go to **APIs & Services > OAuth consent screen**
   - Choose **External** (or Internal if using Google Workspace)
   - Fill in required fields:
     - App name: `CalendarSync` (or any name)
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue**
   - On Scopes page, click **Add or Remove Scopes**
   - Add: `https://www.googleapis.com/auth/calendar`
   - Save and continue through remaining steps

5. Create OAuth credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Desktop app**
   - Name: `CalendarSync`
   - Click **Create**
   - **Save the Client ID and Client Secret** - you'll need these

6. Add test users (if consent screen is in testing mode):
   - Go to **OAuth consent screen > Test users**
   - Add the email addresses of all Google accounts you'll sync

### 2. Find Your Calendar IDs

For each calendar you want to sync:

1. Open [Google Calendar](https://calendar.google.com/)
2. Click the three dots next to the calendar name
3. Click **Settings and sharing**
4. Scroll to **Integrate calendar**
5. Copy the **Calendar ID**
   - For primary calendars, this is usually your email address
   - For secondary calendars, it's a long string like `abc123@group.calendar.google.com`

### 3. Configure CalendarSync

```bash
# Clone and enter the directory
cd calendar-sync

# Run setup script
./scripts/setup.sh

# Edit the config files with your credentials
nano config/sync-a-to-b.yaml
nano config/sync-b-to-a.yaml
```

In each config file, replace:
- `YOUR_CLIENT_ID.apps.googleusercontent.com` with your OAuth Client ID
- `YOUR_CLIENT_SECRET` with your OAuth Client Secret
- Calendar IDs with your actual calendar IDs

### 4. Build and Authenticate

```bash
# Build the Docker image
docker compose build

# Authenticate for sync-a-to-b config
# This will print a URL - open it in your browser
docker compose run --rm auth

# If you have a second config, authenticate it too:
# Edit docker-compose.yml to point 'auth' service to sync-b-to-a.yaml, then run again
```

**Authentication flow:**
1. CalendarSync prints a URL
2. Open the URL in your browser
3. Sign in with the Google account that owns the calendar
4. Grant calendar access
5. You'll be redirected to `localhost` - copy the URL
6. Paste the URL back in the terminal
7. Repeat for each unique Google account in your configs

### 5. Test the Sync

```bash
# Run a single sync
docker compose run --rm sync-all
```

Check your calendars - you should see "Busy (synced from Calendar X)" events.

### 6. Schedule Regular Syncs

#### Option A: Cron (simplest)

```bash
# Edit crontab
crontab -e

# Add this line to sync every 15 minutes
*/15 * * * * cd /path/to/calendar-sync && docker compose run --rm sync-all >> /var/log/calendarsync.log 2>&1
```

#### Option B: Systemd Timer (Linux servers)

Create `/etc/systemd/system/calendarsync.service`:
```ini
[Unit]
Description=CalendarSync
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/path/to/calendar-sync
ExecStart=/usr/bin/docker compose run --rm sync-all
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

# Check status
systemctl list-timers | grep calendarsync
```

## Configuration Reference

### Sync Window

```yaml
sync:
  start:
    identifier: MonthStart  # or: Now, MonthEnd, YearStart, YearEnd
    offset: 0               # months offset
  end:
    identifier: MonthEnd
    offset: +1              # sync current + next month
```

### Transformations

Control what gets copied from source events:

| Transformer | Description |
|-------------|-------------|
| `KeepTitle` | Copy original event title |
| `ReplaceTitle` | Replace with custom text |
| `PrefixTitle` | Add prefix to title |
| `KeepLocation` | Copy location |
| `KeepDescription` | Copy description |
| `KeepReminders` | Copy reminder settings |
| `KeepAttendees` | Copy attendee list |
| `KeepMeetingLink` | Add meeting link to description |

### Filters

Control which events get synced:

| Filter | Description |
|--------|-------------|
| `DeclinedEvents` | Skip events you've declined |
| `AllDayEvents` | Skip all-day events |
| `TitleRegex` | Skip events matching regex |
| `TimeFrame` | Only sync within time window (e.g., 8am-6pm) |

### Preventing Sync Loops

The example configs include a `TitleRegex` filter to prevent synced events from being synced back:

```yaml
filters:
  - name: TitleRegex
    config:
      Regex: "^Busy \\(synced from Calendar [AB]\\)$"
```

**Important:** Keep your `ReplaceTitle` text consistent and make sure the regex matches it.

## Troubleshooting

### "Token has been revoked"
Re-authenticate: `docker compose run --rm auth`

### Events not syncing
- Check calendar IDs are correct
- Verify OAuth app has calendar scope
- Check sync window (start/end dates)
- Review filters - they might be excluding your events

### Duplicate events
- Ensure `TitleRegex` filter matches your `ReplaceTitle` text
- CalendarSync should update existing synced events, not create duplicates

### "Access blocked" during OAuth
- Add your email to test users in Google Cloud Console
- Or publish the OAuth app (requires verification for sensitive scopes)

## Files

```
calendar-sync/
├── config/
│   ├── sync-a-to-b.yaml.example    # Template for A→B sync
│   └── sync-b-to-a.yaml.example    # Template for B→A sync
├── data/                            # Auth tokens (gitignored)
├── scripts/
│   ├── setup.sh                     # Initial setup helper
│   └── sync-all.sh                  # Run both syncs
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

## Cleanup

To remove all synced blocker events:

```bash
# Clean synced events from Calendar B
docker compose run --rm calendarsync --config /app/config/sync-a-to-b.yaml --clean

# Clean synced events from Calendar A
docker compose run --rm calendarsync --config /app/config/sync-b-to-a.yaml --clean
```

## References

- [CalendarSync GitHub](https://github.com/inovex/CalendarSync)
- [Google Calendar API](https://developers.google.com/calendar/api)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
