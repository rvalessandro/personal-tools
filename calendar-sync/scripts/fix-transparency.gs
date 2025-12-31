/**
 * Google Apps Script: Fix CalendarSync Event Transparency
 *
 * CalendarSync doesn't set transparency to "opaque", causing events
 * to show as "free" instead of "busy". This breaks Notion Calendar's
 * ability to combine/overlay events.
 *
 * Setup:
 * 1. Go to https://script.google.com
 * 2. Create new project
 * 3. Paste this code
 * 4. Click Services (+) → Add "Google Calendar API"
 * 5. Update CONFIG below with your calendar ID
 * 6. Run fixSyncedEventTransparency()
 * 7. Optionally run createTrigger() to automate
 */

const CONFIG = {
  // The calendar where synced events are created (sink calendar)
  calendarId: 'andro@laku6.com',

  // Title of synced events (must match ReplaceTitle in CalendarSync config)
  eventTitle: 'Busy',

  // How many days ahead to check for events
  daysToCheck: 60,
};

/**
 * Main function: Fix transparency for all synced events
 * Changes events from "transparent" (free) to "opaque" (busy)
 */
function fixSyncedEventTransparency() {
  const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
  if (!calendar) {
    console.error('Calendar not found: ' + CONFIG.calendarId);
    return;
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + CONFIG.daysToCheck * 24 * 60 * 60 * 1000);

  console.log('Checking events from ' + now.toDateString() + ' to ' + endDate.toDateString());

  const events = calendar.getEvents(now, endDate, { search: CONFIG.eventTitle });

  let updatedCount = 0;
  let skippedCount = 0;

  for (const event of events) {
    // Only update events with exact title match
    if (event.getTitle() === CONFIG.eventTitle) {
      const eventId = event.getId().split('@')[0];

      try {
        const calEvent = Calendar.Events.get(CONFIG.calendarId, eventId);

        if (calEvent.transparency !== 'opaque') {
          calEvent.transparency = 'opaque';
          Calendar.Events.update(calEvent, CONFIG.calendarId, eventId);
          updatedCount++;
          console.log('✓ Fixed: ' + event.getStartTime().toLocaleString());
        } else {
          skippedCount++;
        }
      } catch (e) {
        console.error('✗ Error updating event: ' + e.message);
      }
    }
  }

  console.log('');
  console.log('=== Summary ===');
  console.log('Updated: ' + updatedCount + ' events');
  console.log('Already fixed: ' + skippedCount + ' events');
}

/**
 * Create automatic trigger to run every 30 minutes
 * Run this once to set up automation
 */
function createTrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'fixSyncedEventTransparency') {
      ScriptApp.deleteTrigger(trigger);
      console.log('Deleted existing trigger');
    }
  }

  // Create new trigger - runs every 30 minutes
  ScriptApp.newTrigger('fixSyncedEventTransparency')
    .timeBased()
    .everyMinutes(30)
    .create();

  console.log('✓ Trigger created: runs every 30 minutes');
}

/**
 * Remove the automatic trigger
 */
function deleteTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'fixSyncedEventTransparency') {
      ScriptApp.deleteTrigger(trigger);
      console.log('✓ Trigger deleted');
    }
  }
}

/**
 * Test function: Check current transparency of synced events
 */
function checkEventTransparency() {
  const calendar = CalendarApp.getCalendarById(CONFIG.calendarId);
  if (!calendar) {
    console.error('Calendar not found: ' + CONFIG.calendarId);
    return;
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Next 7 days

  const events = calendar.getEvents(now, endDate, { search: CONFIG.eventTitle });

  console.log('Checking next 7 days...');
  console.log('');

  for (const event of events) {
    if (event.getTitle() === CONFIG.eventTitle) {
      const eventId = event.getId().split('@')[0];

      try {
        const calEvent = Calendar.Events.get(CONFIG.calendarId, eventId);
        const status = calEvent.transparency === 'opaque' ? '✓ Busy' : '✗ Free';
        console.log(status + ' | ' + event.getStartTime().toLocaleString());
      } catch (e) {
        console.error('Error: ' + e.message);
      }
    }
  }
}
