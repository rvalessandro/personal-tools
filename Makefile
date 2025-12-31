.PHONY: help bot bot-logs bot-stop calendar-sync calendar-clean build

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Telegram Bot:"
	@echo "  bot          Start telegram bot"
	@echo "  bot-logs     View bot logs"
	@echo "  bot-stop     Stop telegram bot"
	@echo ""
	@echo "Calendar Sync:"
	@echo "  calendar-sync   Run calendar sync"
	@echo "  calendar-clean  Clean synced events"
	@echo ""
	@echo "Build:"
	@echo "  build        Build all Docker images"

# Telegram Bot
bot:
	docker compose up -d telegram-bot

bot-logs:
	docker compose logs -f telegram-bot

bot-stop:
	docker compose down telegram-bot

# Calendar Sync
calendar-sync:
	docker compose run --rm calendar-sync sync

calendar-clean:
	docker compose run --rm calendar-sync clean

# Build
build:
	docker compose build
