#!/usr/bin/env npx tsx
/**
 * CLI for creating calendar events via CalDAV
 * Usage: npx tsx src/cal-cli.ts <json>
 *
 * JSON format:
 * {
 *   "title": "Event title",
 *   "start": "2024-01-15T14:00:00",
 *   "end": "2024-01-15T15:00:00",
 *   "account": "personal",
 *   "attendees": ["person@email.com"],
 *   "location": "optional",
 *   "description": "optional"
 * }
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../.env") });

import { getCalendarService, type CreateEventInput } from "./calendar.js";

async function main() {
  const jsonArg = process.argv[2];

  if (!jsonArg) {
    console.error("Usage: npx tsx src/cal-cli.ts '<json>'");
    console.error("\nExample:");
    console.error(`npx tsx src/cal-cli.ts '{"title":"Meeting","start":"2024-01-15T14:00:00","end":"2024-01-15T15:00:00","account":"personal"}'`);
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(jsonArg);

    // Validate required fields
    if (!parsed.title || !parsed.start || !parsed.end || !parsed.account) {
      console.error("Missing required fields: title, start, end, account");
      process.exit(1);
    }

    const calService = getCalendarService();
    const accounts = calService.getAccountNames();

    if (!accounts.includes(parsed.account.toLowerCase())) {
      console.error(`Unknown account: ${parsed.account}`);
      console.error(`Available accounts: ${accounts.join(", ")}`);
      process.exit(1);
    }

    const eventInput: CreateEventInput = {
      title: parsed.title,
      start: new Date(parsed.start),
      end: new Date(parsed.end),
      location: parsed.location,
      description: parsed.description,
      attendees: parsed.attendees || [],
    };

    const result = await calService.createEvent(parsed.account, eventInput);

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

main();
