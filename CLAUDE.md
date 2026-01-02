# CLAUDE.md - Project Instructions

This is Andro's personal tools monorepo for productivity automation.

## Repository Structure

```
andro-tools/
├── telegram-bot/       # Telegram bot for Claude Code + Calendar
├── claude-config/      # Claude Code commands and settings
├── knowledge-base/     # Obsidian vault with todos, notes, contacts
├── calendar-sync/      # CalendarSync tool (not actively used)
└── Makefile           # Common operations
```

## Key Components

### Telegram Bot (`telegram-bot/`)
- Chat with Claude Code via Telegram
- Calendar integration (CalDAV) for 3 accounts:
  - `personal` - ralessandro939@gmail.com
  - `systeric` - andro@systeric.com
  - `laku6` - andro@laku6.com
- Commands: `/cal`, `/events`, `/calendars`, `/new`, `/help`

### Claude Config (`claude-config/`)
Custom slash commands synced to `~/.claude/`:
- `/today` - Morning briefing with Quick Kills, PRs, Linear issues
- `/todo` - Create todos in knowledge-base with Shishir-style schema
- `/draft-ticket` - Draft Linear tickets
- `/review-draft` - Review drafts

Sync scripts:
- `./claude-config/push.sh` - Deploy to ~/.claude
- `./claude-config/pull.sh` - Pull from ~/.claude

### Knowledge Base (`knowledge-base/`)
Obsidian vault with:
- `daily/` - Daily notes (YYYY-MM-DD.md)
- `10-notes/` - General notes
- `20-todos/` - Task files with frontmatter schema
- `30-habits/` - Habit tracking
- `40-contacts/` - Contact cards (static info only)
- `templates/` - Templates for notes, todos, contacts

Git-based sync between desktop and server via cron.

## Work Categories

When creating todos or organizing work:
- `0: General`
- `1: Systeric` - Your company
- `2: sys: SeeDr` - Systeric client
- `3: sys: NoOn` - Systeric client
- `4: carousell/lk6` - Head of Engineering role
- `8: Personal`

## Common Commands

```bash
# Telegram bot
make bot-deploy    # Pull, build, restart
make bot-logs      # View logs
make bot-restart   # Restart only

# Claude config
make push-cc-configs  # Deploy commands to ~/.claude
make pull-cc-configs  # Pull from ~/.claude to repo

# Knowledge base sync (server)
./knowledge-base/scripts/autocommit.sh  # Manual sync
# Cron runs every 5 minutes automatically
```

## Environment Variables

See `.env.example` for required variables:
- `TELEGRAM_BOT_TOKEN` - Telegram bot token
- `ALLOWED_USER_IDS` - Telegram user ID(s)
- `CALDAV_*_EMAIL/PASSWORD` - Google Calendar app passwords

## Development Notes

- Telegram bot uses Claude CLI (`claude -p`) for AI features
- Calendar uses CalDAV with App Passwords (no OAuth browser needed)
- Knowledge base syncs via git (not Syncthing) to avoid conflicts
- Conflict detection notifies via Telegram
