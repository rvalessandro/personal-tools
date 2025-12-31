.PHONY: help bot-build bot-dev bot-start bot-stop bot-logs bot-restart calendar-sync calendar-clean sync-config

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Telegram Bot:"
	@echo "  bot-build    Install deps and build"
	@echo "  bot-dev      Run in dev mode (foreground)"
	@echo "  bot-start    Start in background (PM2)"
	@echo "  bot-stop     Stop background process"
	@echo "  bot-logs     View logs"
	@echo "  bot-restart  Restart bot"
	@echo ""
	@echo "Calendar Sync:"
	@echo "  calendar-sync   Run calendar sync"
	@echo "  calendar-clean  Clean synced events"
	@echo ""
	@echo "Config:"
	@echo "  sync-config  Sync Claude commands & MCPs from repo to ~/.claude"

# Telegram Bot
bot-build:
	cd telegram-bot && pnpm install && pnpm build

bot-dev:
	cd telegram-bot && pnpm dev

bot-start:
	cd telegram-bot && pm2 start dist/index.js --name telegram-bot

bot-stop:
	pm2 stop telegram-bot

bot-logs:
	pm2 logs telegram-bot

bot-restart:
	pm2 restart telegram-bot

# Calendar Sync
calendar-sync:
	docker compose run --rm calendar-sync sync

calendar-clean:
	docker compose run --rm calendar-sync clean

# Config Sync
sync-config:
	./claude-config/sync-to-server.sh
