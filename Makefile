.PHONY: help bot-build bot-dev bot-start bot-stop bot-logs bot-restart bot-deploy calendar-sync calendar-clean pull-cc-configs push-cc-configs livesync-start livesync-stop livesync-logs livesync-init

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
	@echo "  bot-deploy   Pull, build, and restart"
	@echo ""
	@echo "Calendar Sync:"
	@echo "  calendar-sync   Run calendar sync"
	@echo "  calendar-clean  Clean synced events"
	@echo ""
	@echo "Claude Config:"
	@echo "  pull-cc-configs  Pull ~/.claude configs into repo (for committing)"
	@echo "  push-cc-configs  Apply repo configs to ~/.claude (on server)"
	@echo ""
	@echo "LiveSync (Obsidian):"
	@echo "  livesync-start   Start CouchDB container"
	@echo "  livesync-stop    Stop CouchDB container"
	@echo "  livesync-logs    View CouchDB logs"
	@echo "  livesync-init    Initialize database (first time)"

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

bot-deploy:
	git pull && $(MAKE) bot-build && $(MAKE) bot-restart

# Calendar Sync
calendar-sync:
	docker compose run --rm calendar-sync sync

calendar-clean:
	docker compose run --rm calendar-sync clean

# Claude Config
pull-cc-configs:
	./claude-config/pull.sh

push-cc-configs:
	./claude-config/push.sh

# LiveSync (Obsidian)
livesync-start:
	docker compose --profile livesync up -d couchdb

livesync-stop:
	docker compose --profile livesync stop couchdb

livesync-logs:
	docker compose --profile livesync logs -f couchdb

livesync-init:
	@echo "Initializing CouchDB database for LiveSync..."
	@curl -X PUT http://admin:$${COUCHDB_PASSWORD}@127.0.0.1:5984/obsidian-livesync
	@echo "\nDatabase created. Configure your Obsidian LiveSync plugin with:"
	@echo "  URI: https://your-server.com/couchdb"
	@echo "  Database: obsidian-livesync"
