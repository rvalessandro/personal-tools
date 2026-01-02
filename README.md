# Andro Tools

Personal productivity automation tools.

## Components

| Component | Description |
|-----------|-------------|
| [telegram-bot](telegram-bot/) | Chat with Claude Code via Telegram + Calendar |
| [claude-config](claude-config/) | Custom Claude Code commands (`/today`, `/todo`) |
| [knowledge-base](knowledge-base/) | Obsidian vault for notes, todos, contacts |

## Quick Start

### Server Setup

```bash
# Clone
git clone https://github.com/rvalessandro/personal-tools.git
cd personal-tools

# Configure
cp .env.example .env
# Edit .env with your tokens

# Deploy telegram bot
make bot-deploy
```

### Desktop Setup

```bash
# Sync Claude commands
make push-cc-configs

# Setup knowledge-base sync in Obsidian
# Install Obsidian Git plugin, configure auto-pull/push
```

## Makefile Commands

```bash
# Telegram Bot
make bot-deploy     # Pull, build, restart
make bot-logs       # View PM2 logs
make bot-restart    # Restart only

# Claude Config
make push-cc-configs   # Deploy to ~/.claude
make pull-cc-configs   # Pull from ~/.claude
```

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/cal <event>` | Create calendar event (natural language) |
| `/events [account] [days]` | List upcoming events |
| `/calendars` | Show calendar accounts |
| `/new` | Start fresh Claude conversation |
| Any message | Chat with Claude Code |

Examples:
```
/cal Meeting with John tomorrow 3pm on systeric
/events laku6 7
```

## Claude Commands

| Command | Description |
|---------|-------------|
| `/today` | Morning briefing - PRs, Linear, todos |
| `/todo` | Create todo in knowledge-base |
| `/draft-ticket` | Draft Linear ticket |

## Architecture

```
Desktop (Obsidian) <-- git sync --> Server (Cron)
                                       |
                                       v
                               Telegram Bot
                                       |
                         +-------------+-------------+
                         |             |             |
                    Claude Code    Calendar      Notifications
                         |          (CalDAV)     (Telegram)
                    MCP Servers
                    (Linear, SigNoz, Metabase)
```

## License

Private repository.
