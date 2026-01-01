#!/usr/bin/env node
/**
 * Get today's calendar events from Google Calendar
 * Uses the same OAuth credentials as calendar-sync
 *
 * Usage:
 *   node scripts/get-today-events.js [--calendar=email@example.com]
 *
 * Output: JSON array of events with time, title, and meeting links
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '../config/systeric-to-laku6.yaml');
const TOKEN_PATH = join(__dirname, '../data/calendar-tokens.json');

// Parse command line args
const args = process.argv.slice(2);
const calendarArg = args.find(a => a.startsWith('--calendar='));
const targetCalendar = calendarArg ? calendarArg.split('=')[1] : null;

// Parse YAML config to get OAuth credentials
function parseConfig() {
  const content = readFileSync(CONFIG_PATH, 'utf8');

  // Simple YAML parsing for our specific format
  const clientIdMatch = content.match(/clientId:\s*"([^"]+)"/);
  const clientKeyMatch = content.match(/clientKey:\s*"([^"]+)"/);
  const calendarMatch = content.match(/calendar:\s*"([^"]+)"/);

  if (!clientIdMatch || !clientKeyMatch) {
    throw new Error('Could not parse OAuth credentials from config');
  }

  return {
    clientId: clientIdMatch[1],
    clientSecret: clientKeyMatch[1],
    calendar: targetCalendar || calendarMatch[1]
  };
}

// Create OAuth2 client
function createOAuth2Client(config) {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    'http://localhost:3000/oauth2callback'
  );
}

// Get authorization URL for user consent
function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly']
  });
}

// Prompt user for authorization code
async function promptForCode() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stderr
  });

  return new Promise((resolve) => {
    rl.question('Enter the authorization code: ', (code) => {
      rl.close();
      resolve(code);
    });
  });
}

// Load saved tokens or initiate OAuth flow
async function authorize(oauth2Client) {
  // Try to load existing tokens
  if (existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);

    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        writeFileSync(TOKEN_PATH, JSON.stringify(credentials));
      } catch (err) {
        console.error('Token refresh failed, re-authenticating...', err.message);
        await initiateOAuth(oauth2Client);
      }
    }
    return;
  }

  await initiateOAuth(oauth2Client);
}

async function initiateOAuth(oauth2Client) {
  const authUrl = getAuthUrl(oauth2Client);
  console.error('Authorize this app by visiting:', authUrl);

  const code = await promptForCode();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  console.error('Tokens saved to', TOKEN_PATH);
}

// Get today's events
async function getTodayEvents(oauth2Client, calendarId) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Today start and end in local timezone
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const response = await calendar.events.list({
    calendarId: calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = response.data.items || [];

  return events.map(event => {
    const start = event.start.dateTime || event.start.date;
    const end = event.end.dateTime || event.end.date;
    const isAllDay = !event.start.dateTime;

    // Extract meeting link
    let meetingLink = null;
    if (event.hangoutLink) {
      meetingLink = event.hangoutLink;
    } else if (event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(e => e.entryPointType === 'video');
      if (videoEntry) meetingLink = videoEntry.uri;
    } else if (event.location?.startsWith('http')) {
      meetingLink = event.location;
    }

    // Calculate duration in minutes
    let durationMin = null;
    if (!isAllDay) {
      durationMin = Math.round((new Date(end) - new Date(start)) / 60000);
    }

    return {
      id: event.id,
      title: event.summary || '(No title)',
      start,
      end,
      isAllDay,
      durationMin,
      location: event.location || null,
      meetingLink,
      status: event.status,
      attendees: event.attendees?.length || 0,
      organizer: event.organizer?.email || null,
    };
  });
}

// Main
async function main() {
  try {
    const config = parseConfig();
    const oauth2Client = createOAuth2Client(config);

    await authorize(oauth2Client);

    const events = await getTodayEvents(oauth2Client, config.calendar);

    // Output as JSON to stdout
    console.log(JSON.stringify(events, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
