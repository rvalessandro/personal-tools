# Telegram Bot for Claude Code

Chat with Claude Code via Telegram. Access your MCPs (Linear, SigNoz, Metabase), file system, and all Claude Code tools from your phone.

## Docker Deployment (Recommended)

From the root of `andro-tools`:

```bash
# Copy and configure environment
cp .env.example .env

# Start the bot
docker compose up -d telegram-bot

# View logs
docker compose logs -f telegram-bot
```

## Local Development

```bash
cd telegram-bot
pnpm install
cp ../.env.example .env  # Edit with your values
pnpm dev
```

## Commands

- Send any message - Interact with Claude Code
- `/new` - Start fresh conversation
- `/help` - Show help

## How It Works

```
You (Telegram) → Bot → claude -p "message" → Response
```

- Uses Claude CLI with session resumption
- Mounts your workspace for file access
- Mounts ~/.claude for MCP server configs
