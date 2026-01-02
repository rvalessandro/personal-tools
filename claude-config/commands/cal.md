# Calendar Event

Create a calendar event from natural language input.

## Available Accounts

Run this to see available accounts:
```bash
cd ~/Desktop/projects/personal/andro-tools/telegram-bot && npx tsx -e "import { config } from 'dotenv'; config({ path: '../.env' }); import { getCalendarService } from './src/calendar.js'; console.log(getCalendarService().getAccountNames().join(', '));"
```

Common accounts: `personal`, `systeric`, `laku6`

## Process

1. **Parse the input** into structured data:
   - Title (remove email addresses from title)
   - Start date/time (use today as reference, Jakarta timezone GMT+7)
   - End date/time (default: 1 hour after start)
   - Account (default: personal, or infer from context - work meetings → systeric/laku6)
   - Attendees (extract email addresses from input)
   - Location (if mentioned)

2. **Create the event** using the CLI:
   ```bash
   cd ~/Desktop/projects/personal/andro-tools/telegram-bot && npx tsx src/cal-cli.ts '<json>'
   ```

   JSON format:
   ```json
   {
     "title": "Event title",
     "start": "YYYY-MM-DDTHH:MM:SS",
     "end": "YYYY-MM-DDTHH:MM:SS",
     "account": "personal",
     "attendees": ["person@email.com"],
     "location": "optional",
     "description": "optional"
   }
   ```

3. **Confirm success** and show the created event details.

## Examples

**Input:** "Meeting with john@example.com tomorrow 3pm for 1h on systeric"
**Parsed:**
- Title: "Meeting with John"
- Start: 2024-01-16T15:00:00
- End: 2024-01-16T16:00:00
- Account: systeric
- Attendees: ["john@example.com"]

**Input:** "Standup 9am-9:30am"
**Parsed:**
- Title: "Standup"
- Start: 2024-01-15T09:00:00
- End: 2024-01-15T09:30:00
- Account: personal (default)
- Attendees: []

**Input:** "Call with client@company.com and partner@other.com Friday 2pm"
**Parsed:**
- Title: "Call"
- Start: 2024-01-19T14:00:00
- End: 2024-01-19T15:00:00
- Account: personal
- Attendees: ["client@company.com", "partner@other.com"]

## Notes

- All times are in Jakarta timezone (GMT+7)
- Email addresses in input are extracted as attendees and receive Google Calendar invites
- If no end time specified, default duration is 1 hour
- Use 24-hour format for the JSON timestamps
