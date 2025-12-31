import { config } from "dotenv";
import { resolve } from "path";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { askClaude, clearSession } from "./claude.js";

// Load .env from parent directory
config({ path: resolve(import.meta.dirname, "../../.env") });

// Config from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = process.env.ALLOWED_USER_IDS?.split(",").map(Number) || [];
const WORKING_DIR = process.env.WORKING_DIRECTORY || process.cwd();

if (!BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is required");
  process.exit(1);
}

if (ALLOWED_USERS.length === 0) {
  console.warn("Warning: ALLOWED_USER_IDS not set - bot will reject all messages");
}

const bot = new Telegraf(BOT_TOKEN);

// Auth middleware
bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (!userId || !ALLOWED_USERS.includes(userId)) {
    console.log(`Rejected user: ${userId}`);
    return;
  }
  return next();
});

// Commands
bot.command("start", (ctx) => {
  ctx.reply(
    "Claude Code Bot\n\n" +
      "Send any message to interact with Claude Code.\n" +
      "Commands:\n" +
      "/new - Start a fresh conversation\n" +
      "/help - Show this message"
  );
});

bot.command("help", (ctx) => {
  ctx.reply(
    "Send any message and I'll forward it to Claude Code.\n\n" +
      "Claude has access to:\n" +
      "- Your codebase\n" +
      "- MCP servers (Linear, SigNoz, etc.)\n" +
      "- Bash, file operations\n\n" +
      "/new - Start fresh conversation"
  );
});

bot.command("new", (ctx) => {
  const userId = ctx.from?.id;
  if (userId) {
    clearSession(userId);
    ctx.reply("Session cleared. Starting fresh conversation.");
  }
});

// Handle all text messages
bot.on(message("text"), (ctx) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  const text = ctx.message.text;

  console.log(`[${userId}] ${text.substring(0, 50)}...`);

  // Send immediate acknowledgment
  ctx.reply("Thinking...").catch(console.error);

  // Run Claude in background (don't await - avoids Telegraf timeout)
  askClaude(userId, text, WORKING_DIR)
    .then(async (result) => {
      const response = result.response || "No response from Claude";

      // Telegram has 4096 char limit
      if (response.length <= 4096) {
        await bot.telegram
          .sendMessage(chatId, response, { parse_mode: "Markdown" })
          .catch(() => bot.telegram.sendMessage(chatId, response));
      } else {
        // Split into chunks
        for (let i = 0; i < response.length; i += 4096) {
          await bot.telegram.sendMessage(chatId, response.slice(i, i + 4096));
        }
      }
    })
    .catch((err) => {
      console.error(`[Claude] Error: ${err.message}`);
      bot.telegram.sendMessage(chatId, `Error: ${err.message}`).catch(console.error);
    });
});

// Start bot
bot.launch();
console.log(`Bot started. Working directory: ${WORKING_DIR}`);
console.log(`Allowed users: ${ALLOWED_USERS.join(", ")}`);
console.log(`HOME: ${process.env.HOME}`);
console.log(`USER: ${process.env.USER}`);

// Graceful shutdown
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
