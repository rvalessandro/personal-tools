import { config } from "dotenv";
config({ path: "../.env" });

import { getCalendarService } from "./src/calendar.js";

async function test() {
  const service = getCalendarService();
  const accounts = service.getAccountNames();

  console.log("Available accounts:", accounts);

  for (const account of accounts) {
    console.log(`\n--- Testing ${account} ---`);
    const result = await service.listEvents(account, 2);

    if (result.success && result.events) {
      console.log(result.events.join("\n"));
    } else {
      console.log("Error:", result.message);
    }
  }
}

test().catch(console.error);
