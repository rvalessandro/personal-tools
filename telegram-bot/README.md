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
