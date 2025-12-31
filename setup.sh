#!/bin/bash
set -e

echo "=== Installing nvm ==="
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "=== Installing Node.js (latest LTS) ==="
nvm install --lts
nvm use --lts
nvm alias default node

echo "=== Installing pnpm ==="
corepack enable
corepack prepare pnpm@latest --activate

echo "=== Installing PM2 ==="
npm install -g pm2

echo "=== Installing Claude Code ==="
npm install -g @anthropic-ai/claude-code

echo "=== Building telegram-bot ==="
cd telegram-bot
pnpm install
pnpm build

echo ""
echo "=== Done! ==="
echo "1. Restart shell or run: source ~/.bashrc"
echo "2. Authenticate Claude: claude"
echo "3. Configure .env"
echo "4. Start bot: make bot-start"
