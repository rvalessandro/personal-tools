#!/usr/bin/env node
/**
 * Get and categorize emails from Gmail
 * Categories: needs-reply, fyi, unsubscribe, newsletter
 *
 * Usage:
 *   node scripts/get-emails.js [--limit=50] [--unread-only]
 *
 * Output: JSON with categorized emails
 */

import { google } from 'googleapis';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '../config/systeric-to-laku6.yaml');
const TOKEN_PATH = join(__dirname, '../data/gmail-tokens.json');

// Parse command line args
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
const unreadOnly = args.includes('--unread-only');

// Parse YAML config to get OAuth credentials (reusing same OAuth app)
function parseConfig() {
  const content = readFileSync(CONFIG_PATH, 'utf8');
  const clientIdMatch = content.match(/clientId:\s*"([^"]+)"/);
  const clientKeyMatch = content.match(/clientKey:\s*"([^"]+)"/);

  if (!clientIdMatch || !clientKeyMatch) {
    throw new Error('Could not parse OAuth credentials from config');
  }

  return {
    clientId: clientIdMatch[1],
    clientSecret: clientKeyMatch[1],
  };
}

function createOAuth2Client(config) {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    'http://localhost:3000/oauth2callback'
  );
}

function getAuthUrl(oauth2Client) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
}

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

async function authorize(oauth2Client) {
  if (existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
    oauth2Client.setCredentials(tokens);

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

// Patterns for categorization
const NEWSLETTER_PATTERNS = [
  /newsletter/i,
  /digest/i,
  /weekly\s*(update|roundup|recap)/i,
  /daily\s*(update|roundup|recap)/i,
  /unsubscribe/i,
  /list-unsubscribe/i,
];

const UNSUBSCRIBE_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /notifications@/i,
  /updates@/i,
  /marketing@/i,
  /promo/i,
  /deals@/i,
  /offers@/i,
];

const FYI_PATTERNS = [
  /fyi/i,
  /for your information/i,
  /just letting you know/i,
  /heads up/i,
  /automated/i,
  /notification/i,
];

// Categorize an email based on headers and content
function categorizeEmail(email) {
  const from = email.from || '';
  const subject = email.subject || '';
  const hasUnsubscribe = email.hasUnsubscribeHeader;

  // Check if newsletter
  const isNewsletter = NEWSLETTER_PATTERNS.some(p =>
    p.test(subject) || p.test(from)
  ) || hasUnsubscribe;

  // Check if promotional/unsubscribe worthy
  const isUnsubscribeWorthy = UNSUBSCRIBE_PATTERNS.some(p =>
    p.test(from)
  ) && !isNewsletter;

  // Check if FYI
  const isFyi = FYI_PATTERNS.some(p =>
    p.test(subject)
  );

  // Needs reply: from a person (not automated), not newsletter, not FYI
  const needsReply = !isNewsletter && !isUnsubscribeWorthy && !isFyi &&
    !from.includes('noreply') && !from.includes('no-reply');

  if (isNewsletter) return 'newsletter';
  if (isUnsubscribeWorthy) return 'unsubscribe';
  if (isFyi) return 'fyi';
  if (needsReply) return 'needs-reply';
  return 'other';
}

async function getEmails(oauth2Client) {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  // Get message list
  const query = unreadOnly ? 'is:unread' : 'in:inbox';
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    maxResults: limit,
    q: query,
  });

  const messages = listResponse.data.messages || [];
  const emails = [];

  // Fetch details for each message
  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date', 'List-Unsubscribe'],
    });

    const headers = detail.data.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const email = {
      id: msg.id,
      threadId: msg.threadId,
      from: getHeader('From'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
      snippet: detail.data.snippet,
      isUnread: detail.data.labelIds?.includes('UNREAD'),
      hasUnsubscribeHeader: !!getHeader('List-Unsubscribe'),
      gmailLink: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
    };

    email.category = categorizeEmail(email);
    emails.push(email);
  }

  return emails;
}

// Group emails by category
function groupByCategory(emails) {
  const groups = {
    'needs-reply': [],
    'fyi': [],
    'newsletter': [],
    'unsubscribe': [],
    'other': [],
  };

  for (const email of emails) {
    groups[email.category].push(email);
  }

  return groups;
}

// Generate Gmail filter links
function generateFilterLinks() {
  const baseUrl = 'https://mail.google.com/mail/u/0/#search/';
  return {
    unread: baseUrl + encodeURIComponent('is:unread'),
    needsReply: baseUrl + encodeURIComponent('is:unread -category:promotions -category:social -category:updates'),
    newsletters: baseUrl + encodeURIComponent('has:unsubscribe OR subject:newsletter OR subject:digest'),
    promotions: baseUrl + encodeURIComponent('category:promotions'),
    unsubscribe: baseUrl + encodeURIComponent('from:noreply OR from:no-reply OR from:notifications'),
  };
}

async function main() {
  try {
    const config = parseConfig();
    const oauth2Client = createOAuth2Client(config);

    await authorize(oauth2Client);

    const emails = await getEmails(oauth2Client);
    const grouped = groupByCategory(emails);
    const filterLinks = generateFilterLinks();

    const output = {
      summary: {
        total: emails.length,
        needsReply: grouped['needs-reply'].length,
        fyi: grouped['fyi'].length,
        newsletter: grouped['newsletter'].length,
        unsubscribe: grouped['unsubscribe'].length,
        other: grouped['other'].length,
      },
      filterLinks,
      emails: grouped,
    };

    console.log(JSON.stringify(output, null, 2));

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
