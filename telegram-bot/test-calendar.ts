import { config } from "dotenv";
config({ path: "../.env" });

import { getCalendarService } from "./src/calendar.js";

async function test() {
  const service = getCalendarService();

  // Test only laku6 for focused output
  console.log("--- Testing laku6 ---");
  const result = await service.listEvents("laku6", 2);

  if (result.success && result.events) {
    console.log(result.events.join("\n"));
  } else {
    console.log("Error:", result.message);
  }
}

test().catch(console.error);
