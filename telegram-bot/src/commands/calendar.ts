import { Telegraf, Context } from "telegraf";
import { getCalendarService, type CreateEventInput } from "../calendar.js";
import { askClaude } from "../claude.js";

export function registerCalendarCommands(bot: Telegraf<Context>, workingDir: string): void {
  // List available calendar accounts
  bot.command("calendars", (ctx) => {
    const calService = getCalendarService();
    const accounts = calService.getAccountNames();
    if (accounts.length === 0) {
      ctx.reply(
        "No calendar accounts configured.\n\n" +
        "Add to .env:\n" +
        "CALDAV_PERSONAL_EMAIL=you@gmail.com\n" +
        "CALDAV_PERSONAL_PASSWORD=app-password"
      );
    } else {
      ctx.reply(`Available calendars:\n${accounts.map((a) => `• ${a}`).join("\n")}`);
    }
  });

  // Create a calendar event
  bot.command("cal", async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text.replace(/^\/cal\s*/, "").trim();

    if (!text) {
      ctx.reply(
        "Usage: /cal <event description>\n\n" +
        "Examples:\n" +
        "• /cal Meeting with John tomorrow 3pm for 1h on work\n" +
        "• /cal Call with person@email.com Monday 12pm on systeric\n" +
        "• /cal Standup 9am-9:30am on personal\n\n" +
        "Include email addresses to send calendar invites automatically."
      );
      return;
    }

    const calService = getCalendarService();
    const accounts = calService.getAccountNames();

    if (accounts.length === 0) {
      ctx.reply("No calendar accounts configured. Use /calendars to see setup instructions.");
      return;
    }

    ctx.reply("📅 Parsing event...").catch(console.error);

    // Use Claude to parse the natural language into structured event
    const parsePrompt = `Parse this calendar event request and return ONLY a JSON object (no markdown, no explanation):

"${text}"

Available calendar accounts: ${accounts.join(", ")}

Return format:
{
  "title": "event title (do NOT include email addresses in the title)",
  "startDate": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endDate": "YYYY-MM-DD",
  "endTime": "HH:MM",
  "account": "account name from available list",
  "location": "optional location",
  "description": "optional description",
  "attendees": ["email1@example.com", "email2@example.com"]
}

IMPORTANT: Extract any email addresses mentioned in the input and add them to the "attendees" array.
Email addresses should be removed from the title - only include the event name/description.
Example: "call with john@example.com" → title: "call with John", attendees: ["john@example.com"]

Use today's date as reference. If no account specified, use "${accounts[0]}".
If no end time, assume 1 hour duration.
If no attendees mentioned, use an empty array [].
Return ONLY the JSON, nothing else.`;

    try {
      const result = await askClaude(userId, parsePrompt, workingDir);
      const response = result.response || "";

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        ctx.reply(
          `Could not parse event. Please try again with a clearer format.\n\nGot: ${response.substring(0, 200)}`
        );
        return;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Build Date objects
      const startDate = new Date(`${parsed.startDate}T${parsed.startTime}:00`);
      const endDate = new Date(`${parsed.endDate}T${parsed.endTime}:00`);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        ctx.reply(`Invalid date/time parsed:\n${JSON.stringify(parsed, null, 2)}`);
        return;
      }

      const eventInput: CreateEventInput = {
        title: parsed.title,
        start: startDate,
        end: endDate,
        location: parsed.location,
        description: parsed.description,
        attendees: parsed.attendees || [],
      };

      const createResult = await calService.createEvent(parsed.account, eventInput);

      if (createResult.success) {
        ctx.reply(`✅ ${createResult.message}`);
      } else {
        ctx.reply(`❌ ${createResult.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Calendar] Error: ${message}`);
      ctx.reply(`Error creating event: ${message}`);
    }
  });

  // List upcoming events
  bot.command("events", async (ctx) => {
    const text = ctx.message.text.replace(/^\/events\s*/, "").trim();
    const calService = getCalendarService();
    const accounts = calService.getAccountNames();

    if (accounts.length === 0) {
      ctx.reply("No calendar accounts configured.");
      return;
    }

    // Parse optional account name and days (default 2 = today + tomorrow)
    const parts = text.split(/\s+/);
    let accountName = accounts[0];
    let days = 2;

    for (const part of parts) {
      if (accounts.includes(part.toLowerCase())) {
        accountName = part.toLowerCase();
      } else if (/^\d+$/.test(part)) {
        days = parseInt(part);
      }
    }

    ctx.reply(`📅 Fetching events from ${accountName}...`).catch(console.error);

    try {
      const result = await calService.listEvents(accountName, days);

      if (result.success && result.events) {
        if (result.events.length === 0) {
          ctx.reply(`No events for today/tomorrow on ${accountName}`);
        } else {
          ctx.reply(`📅 ${accountName}:\n\n${result.events.join("\n")}`);
        }
      } else {
        ctx.reply(`❌ ${result.message}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ctx.reply(`Error: ${message}`);
    }
  });

  console.log("[Commands] Calendar commands registered");
}
