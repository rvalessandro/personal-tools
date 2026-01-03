import { Telegraf, Context } from "telegraf";
import { generateStandup, TEAM_MEMBERS, parseStandupDate } from "../standup.js";

export function registerStandupCommands(bot: Telegraf<Context>): void {
  // Generate daily standup report
  bot.command("standup", async (ctx) => {
    const text = ctx.message.text.replace(/^\/standup\s*/, "").trim();

    // Parse optional date argument
    let targetDate: Date | undefined;
    if (text) {
      const parsed = parseStandupDate(text);
      if (!parsed) {
        ctx.reply(
          "Could not parse date. Try:\n" +
          "• /standup (defaults to yesterday)\n" +
          "• /standup today\n" +
          "• /standup 2026-01-02\n" +
          "• /standup jan 2"
        );
        return;
      }
      targetDate = parsed;
    }

    ctx.reply("📊 Generating standup report...").catch(console.error);

    try {
      const report = await generateStandup(targetDate);

      // Telegram has 4096 char limit
      if (report.length <= 4096) {
        await ctx.reply(report, { parse_mode: "Markdown" }).catch(() =>
          ctx.reply(report) // Fallback without markdown if it fails
        );
      } else {
        // Split into chunks
        for (let i = 0; i < report.length; i += 4096) {
          await ctx.reply(report.slice(i, i + 4096));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Standup] Error: ${message}`);
      ctx.reply(`Error generating standup: ${message}`);
    }
  });

  // List team members being tracked
  bot.command("team", (ctx) => {
    const members = TEAM_MEMBERS.map((m) => `• ${m.name} (@${m.github})`).join("\n");
    ctx.reply(`*ReallySick Team*\n\n${members}`, { parse_mode: "Markdown" });
  });

  console.log("[Commands] Standup commands registered");
}
