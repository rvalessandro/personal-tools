# Telegram Bot for Claude Code

Chat with Claude Code via Telegram. Full access to file system, MCPs, and all Claude Code tools.

## Setup

1. Install Claude Code on server: `npm install -g @anthropic-ai/claude-code`
2. Authenticate: `claude` (follow OAuth flow)
3. Configure `.env` at repo root
4. Build and run:

```bash
make bot-build
make bot
```

## Commands

- Send any message - Interact with Claude Code
- `/new` - Start fresh conversation
- `/help` - Show help

### Calendar Commands

- `/cal <event>` - Create calendar event (natural language)
- `/events [account] [days]` - List upcoming events
- `/calendars` - List configured calendar accounts

Examples:
```
/cal Meeting with John tomorrow 3pm for 1h on work
/cal Dentist Jan 15 2pm on personal
/events work 7
```

### Calendar Setup

1. Enable 2FA on each Google account
2. Create App Passwords: Google Account → Security → App passwords
3. Add to `.env`:

```bash
CALDAV_PERSONAL_EMAIL=you@gmail.com
CALDAV_PERSONAL_PASSWORD=xxxx-xxxx-xxxx-xxxx

CALDAV_WORK_EMAIL=you@company.com
CALDAV_WORK_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

## Production (PM2)

```bash
# Install PM2
npm install -g pm2

# Start
cd telegram-bot
pm2 start dist/index.js --name telegram-bot

# Auto-start on reboot
pm2 save
pm2 startup
```

## How It Works

```
You (Telegram) → Bot → claude -p "message" → Response
```

- Runs directly on server (no Docker)
- Calls `claude` CLI with full file system access
- Session continuity per user via `--resume`
