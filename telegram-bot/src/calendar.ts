import { createDAVClient, DAVClient } from "tsdav";
import { v4 as uuidv4 } from "uuid";

// Calendar account configuration
export interface CalendarAccount {
  name: string; // e.g., "personal", "work1", "work2"
  email: string;
  password: string; // App password from Google
  calendarId?: string; // Optional specific calendar ID
}

// Event creation input
export interface CreateEventInput {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}

// Calendar service for multi-account management
export class CalendarService {
  private accounts: Map<string, CalendarAccount> = new Map();
  private clients: Map<string, DAVClient> = new Map();

  constructor() {
    this.loadAccountsFromEnv();
  }

  private loadAccountsFromEnv(): void {
    // Load accounts from environment variables
    // Format: CALDAV_<NAME>_EMAIL, CALDAV_<NAME>_PASSWORD
    const envKeys = Object.keys(process.env);
    const accountNames = new Set<string>();

    for (const key of envKeys) {
      const match = key.match(/^CALDAV_([A-Z0-9]+)_EMAIL$/);
      if (match) {
        accountNames.add(match[1]);
      }
    }

    for (const name of accountNames) {
      const email = process.env[`CALDAV_${name}_EMAIL`];
      const password = process.env[`CALDAV_${name}_PASSWORD`];
      const calendarId = process.env[`CALDAV_${name}_CALENDAR_ID`];

      if (email && password) {
        this.accounts.set(name.toLowerCase(), {
          name: name.toLowerCase(),
          email,
          password,
          calendarId,
        });
        console.log(`[Calendar] Loaded account: ${name.toLowerCase()}`);
      }
    }
  }

  // Get list of available account names
  getAccountNames(): string[] {
    return Array.from(this.accounts.keys());
  }

  // Get or create DAV client for an account
  private async getClient(accountName: string): Promise<DAVClient> {
    const name = accountName.toLowerCase();

    if (this.clients.has(name)) {
      return this.clients.get(name)!;
    }

    const account = this.accounts.get(name);
    if (!account) {
      throw new Error(`Unknown calendar account: ${name}. Available: ${this.getAccountNames().join(", ")}`);
    }

    console.log(`[Calendar] Connecting to CalDAV for ${account.email}...`);

    try {
      const client = await createDAVClient({
        serverUrl: `https://calendar.google.com/calendar/dav/${account.email}/`,
        credentials: {
          username: account.email,
          password: account.password,
        },
        authMethod: "Basic",
        defaultAccountType: "caldav",
      });

      console.log(`[Calendar] Connected successfully to ${name}`);
      this.clients.set(name, client);
      return client;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Calendar] Connection failed for ${name}: ${message}`);
      throw error;
    }
  }

  // Create an ICS event string
  private createICSEvent(event: CreateEventInput, uid: string): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Telegram Bot//CalDAV//EN",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${event.title}`,
    ];

    if (event.description) {
      lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${event.location}`);
    }

    lines.push("END:VEVENT", "END:VCALENDAR");

    return lines.join("\r\n");
  }

  // Create a calendar event
  async createEvent(
    accountName: string,
    event: CreateEventInput
  ): Promise<{ success: boolean; message: string; eventId?: string }> {
    try {
      const client = await this.getClient(accountName);
      const account = this.accounts.get(accountName.toLowerCase())!;

      // Use direct calendar URL (Google CalDAV discovery doesn't work well)
      const calendarUrl = account.calendarId
        ? `https://calendar.google.com/calendar/dav/${account.calendarId}/events/`
        : `https://calendar.google.com/calendar/dav/${account.email}/events/`;

      const uid = uuidv4();
      const icsContent = this.createICSEvent(event, uid);

      await client.createCalendarObject({
        calendar: { url: calendarUrl },
        filename: `${uid}.ics`,
        iCalString: icsContent,
      });

      const formatTime = (date: Date): string => {
        return date.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Jakarta",
        });
      };

      return {
        success: true,
        message: `Created: "${event.title}" on ${formatTime(event.start)} - ${formatTime(event.end)} (${accountName})`,
        eventId: uid,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Calendar] Error creating event: ${message}`);
      return { success: false, message: `Failed to create event: ${message}` };
    }
  }

  // List upcoming events for an account
  async listEvents(
    accountName: string,
    daysAhead: number = 7
  ): Promise<{ success: boolean; message: string; events?: string[] }> {
    try {
      const client = await this.getClient(accountName);
      const account = this.accounts.get(accountName.toLowerCase())!;

      // Use direct calendar URL (Google CalDAV discovery doesn't work well)
      const calendarUrl = account.calendarId
        ? `https://calendar.google.com/calendar/dav/${account.calendarId}/events/`
        : `https://calendar.google.com/calendar/dav/${account.email}/events/`;

      // Use Jakarta timezone (UTC+7) for date calculations
      const tz = "Asia/Jakarta";

      // Get current date in Jakarta using Intl formatter
      const jakartaFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const [year, month, day] = jakartaFormatter
        .format(new Date())
        .split("-")
        .map(Number);

      // Create start/end in Jakarta time, then convert to UTC for query
      // Start: midnight Jakarta = 17:00 UTC previous day
      const startJakarta = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`);
      const endDay = new Date(startJakarta);
      endDay.setDate(endDay.getDate() + daysAhead);
      const endJakarta = new Date(endDay.toISOString().slice(0, 10) + "T23:59:59+07:00");

      const start = startJakarta;
      const end = endJakarta;

      const calendarObjects = await client.fetchCalendarObjects({
        calendar: { url: calendarUrl },
        timeRange: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });

      type EventStatus = "accepted" | "declined" | "needs-action" | "tentative";

      interface ParsedEvent {
        date: Date;
        summary: string;
        status: EventStatus;
        uid: string;
      }

      const parsedEvents: ParsedEvent[] = [];
      const seenEvents = new Set<string>(); // For deduplication

      for (const obj of calendarObjects) {
        if (obj.data) {
          // Extract UID for deduplication
          const uidMatch = obj.data.match(/UID:(.+)/);
          const uid = uidMatch ? uidMatch[1].trim() : "";

          // Extract SUMMARY
          const summaryMatch = obj.data.match(/SUMMARY:(.+)/);
          if (!summaryMatch) continue;
          const summary = summaryMatch[1].trim();

          // Extract DTSTART - handle various formats
          // DTSTART:20260102T150000Z (UTC)
          // DTSTART:20260102T150000 (local, assume Jakarta)
          // DTSTART;TZID=Asia/Jakarta:20260102T150000
          // DTSTART;VALUE=DATE:20260102 (all-day event)
          const startMatch = obj.data.match(/DTSTART[^:]*:(\d{8})(T(\d{6}))?(Z)?/);
          if (!startMatch) continue;

          const datePart = startMatch[1]; // 20260102
          const timePart = startMatch[3] || "000000"; // 150000 or default midnight
          const isUTC = startMatch[4] === "Z";

          // Check if there's a TZID specified
          const tzidMatch = obj.data.match(/DTSTART;[^:]*TZID=([^:;]+)/);
          const eventTz = tzidMatch ? tzidMatch[1] : null;

          // Parse date/time components
          const evtYear = parseInt(datePart.slice(0, 4));
          const evtMonth = parseInt(datePart.slice(4, 6));
          const evtDay = parseInt(datePart.slice(6, 8));
          const hour = parseInt(timePart.slice(0, 2));
          const min = parseInt(timePart.slice(2, 4));

          let eventDate: Date;
          if (isUTC) {
            eventDate = new Date(Date.UTC(evtYear, evtMonth - 1, evtDay, hour, min));
          } else if (eventTz) {
            // Parse with specific timezone
            const isoStr = `${evtYear}-${String(evtMonth).padStart(2, "0")}-${String(evtDay).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
            // Create date assuming the timezone offset
            if (eventTz.includes("Jakarta") || eventTz.includes("+07")) {
              eventDate = new Date(isoStr + "+07:00");
            } else {
              // Fallback: treat as local Jakarta time
              eventDate = new Date(isoStr + "+07:00");
            }
          } else {
            // No timezone specified, assume Jakarta
            const isoStr = `${evtYear}-${String(evtMonth).padStart(2, "0")}-${String(evtDay).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+07:00`;
            eventDate = new Date(isoStr);
          }

          // Dedupe by UID + date
          const dedupeKey = `${uid}-${eventDate.toISOString()}`;
          if (seenEvents.has(dedupeKey)) continue;
          seenEvents.add(dedupeKey);

          // Extract participation status from ATTENDEE line matching account email
          // ATTENDEE;PARTSTAT=ACCEPTED;CN=Name:mailto:email@example.com
          let status: EventStatus = "accepted"; // Default for events you created
          const attendeeRegex = new RegExp(
            `ATTENDEE[^:]*PARTSTAT=(ACCEPTED|DECLINED|NEEDS-ACTION|TENTATIVE)[^:]*:mailto:${account.email}`,
            "i"
          );
          const attendeeMatch = obj.data.match(attendeeRegex);
          if (attendeeMatch) {
            status = attendeeMatch[1].toLowerCase() as EventStatus;
          }

          parsedEvents.push({ date: eventDate, summary, status, uid });
        }
      }

      // Sort by date
      parsedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

      // Format helper
      const formatEvent = (e: ParsedEvent): string => {
        const dateStr = e.date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: tz,
        });
        const timeStr = e.date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: tz,
        });
        return `${dateStr} ${timeStr} - ${e.summary}`;
      };

      // Categorize by status
      const accepted = parsedEvents.filter(
        (e) => e.status === "accepted" || e.status === "tentative"
      );
      const needsAction = parsedEvents.filter((e) => e.status === "needs-action");
      const declined = parsedEvents.filter((e) => e.status === "declined");

      // Build output sections
      const events: string[] = [];

      // Add timezone header
      events.push(`🕐 Times shown in GMT+7 (Jakarta)\n`);

      if (accepted.length > 0) {
        events.push(...accepted.map(formatEvent));
      } else if (needsAction.length === 0 && declined.length === 0) {
        events.push("No events");
      }

      if (needsAction.length > 0) {
        events.push("", "⏳ Needs Response:");
        events.push(...needsAction.map((e) => `  ${formatEvent(e)}`));
      }

      if (declined.length > 0) {
        events.push("", "❌ Declined:");
        events.push(...declined.map((e) => `  ${formatEvent(e)}`));
      }

      return {
        success: true,
        message: `Found ${parsedEvents.length} events`,
        events,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, message: `Failed to list events: ${message}` };
    }
  }
}

// Parse natural language event input
export interface ParsedEvent {
  title: string;
  start: Date;
  end: Date;
  account?: string;
  description?: string;
  location?: string;
}

// Simple date/time parsing helpers
export function parseEventFromText(text: string): Partial<ParsedEvent> | null {
  // This is a basic parser - Claude will do the heavy lifting
  // Just extract obvious patterns

  const result: Partial<ParsedEvent> = {};

  // Extract account reference (e.g., "on work", "on personal", "work calendar")
  const accountMatch = text.match(/\b(on\s+)?(\w+)\s*(calendar|cal)?\s*$/i);
  if (accountMatch) {
    result.account = accountMatch[2].toLowerCase();
  }

  // Extract duration (e.g., "for 1 hour", "30 min")
  const durationMatch = text.match(/for\s+(\d+)\s*(hour|hr|h|minute|min|m)/i);
  let durationMinutes = 60; // default 1 hour
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith("h")) {
      durationMinutes = value * 60;
    } else {
      durationMinutes = value;
    }
  }

  return result;
}

// Singleton instance
let calendarService: CalendarService | null = null;

export function getCalendarService(): CalendarService {
  if (!calendarService) {
    calendarService = new CalendarService();
  }
  return calendarService;
}
