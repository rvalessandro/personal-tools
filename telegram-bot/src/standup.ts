/**
 * Automated Daily Standup Generator
 * Pulls git commits and Linear activity for ReallySick team
 */

import { execSync } from "child_process";

// Linear API configuration
const LINEAR_API_URL = "https://api.linear.app/graphql";

// Lazy getter for API key (evaluated after dotenv loads, not at module import time)
const getLinearApiKey = () => process.env.SEEDR_LINEAR_API_KEY;

// Team member mapping: GitHub username → Linear email/ID
export const TEAM_MEMBERS = [
  { github: "alvin0727", linear: "alvin.gea@interwise.app", name: "Alvin" },
  { github: "aufaikrimaa", linear: "aufa@interwise.app", name: "Aufa" },
  { github: "jenniferflorentina", linear: "jennifer.florentina@interwise.app", name: "Jennifer" },
  { github: "Jhonhazel", linear: "hazel@interwise.app", name: "Hazel" },
  { github: "K3vinTNR", linear: "kevin.taniar@interwise.app", name: "Kevin" },
  { github: "MichaelVincentS", linear: "michael.vs@interwise.app", name: "Michael" },
  { github: "vincentbmw", linear: "vincent.benedict@interwise.app", name: "Vincent" },
];

const REPO = "See-Dr-Pte-Ltd/reallysick-monorepo";
const GITHUB_BASE = `https://github.com/${REPO}`;
const LINEAR_BASE = "https://linear.app/seedr/issue";

export interface GitCommit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export interface LinearIssue {
  identifier: string;
  title: string;
  state: string;
  updatedAt: string;
}

export interface LinearActivity {
  shipped: LinearIssue[];      // Issues moved to Done
  inProgress: LinearIssue[];   // Issues currently In Progress or In Review
}

export interface MemberStandup {
  name: string;
  github: string;
  commits: GitCommit[];
  linear: LinearActivity;
}

/**
 * Query Linear GraphQL API
 */
async function queryLinear(query: string, variables: Record<string, unknown> = {}): Promise<unknown> {
  const apiKey = getLinearApiKey();
  if (!apiKey) {
    console.warn("[Linear] No API key configured (SEEDR_LINEAR_API_KEY)");
    return null;
  }

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      console.error(`[Linear] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("[Linear] Query failed:", error);
    return null;
  }
}

/**
 * Get Linear issues for a user by status and date
 */
export async function getLinearActivity(
  userEmail: string,
  targetDate: Date
): Promise<LinearActivity> {
  const result: LinearActivity = { shipped: [], inProgress: [] };

  // Format date range for the target day
  const dateStr = targetDate.toISOString().split("T")[0];

  // Query all recent issues for this assignee
  const query = `
    query UserIssues($email: String!) {
      issues(
        filter: {
          assignee: { email: { eq: $email } }
        }
        first: 50
        orderBy: updatedAt
      ) {
        nodes {
          identifier
          title
          state { id name type }
          completedAt
          updatedAt
        }
      }
    }
  `;

  const data = await queryLinear(query, { email: userEmail }) as {
    issues?: {
      nodes: Array<{
        identifier: string;
        title: string;
        state: { id: string; name: string; type: string };
        completedAt: string | null;
        updatedAt: string;
      }>;
    };
  } | null;

  if (!data?.issues?.nodes) {
    return result;
  }

  for (const issue of data.issues.nodes) {
    // Check if completed on target date
    if (issue.completedAt) {
      const completedDate = issue.completedAt.split("T")[0];
      if (completedDate === dateStr) {
        result.shipped.push({
          identifier: issue.identifier,
          title: issue.title,
          state: issue.state.name,
          updatedAt: issue.updatedAt,
        });
      }
    }

    // Check if currently in progress (state type = "started")
    if (issue.state.type === "started") {
      result.inProgress.push({
        identifier: issue.identifier,
        title: issue.title,
        state: issue.state.name,
        updatedAt: issue.updatedAt,
      });
    }
  }

  return result;
}

/**
 * Get git commits from yesterday for a specific author
 */
export async function getGitCommits(
  githubUsername: string,
  since?: string,
  until?: string
): Promise<GitCommit[]> {
  // Default to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const sinceDate = since || yesterday.toISOString().split("T")[0];

  const today = new Date();
  const untilDate = until || today.toISOString().split("T")[0];

  try {
    const result = execSync(
      `gh api repos/${REPO}/commits --jq '.[] | select(.author.login == "${githubUsername}" or .commit.author.name == "${githubUsername}") | {sha: .sha[0:7], message: .commit.message, date: .commit.author.date, author: .author.login}' -q "since=${sinceDate}&until=${untilDate}" 2>/dev/null || true`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    if (!result.trim()) return [];

    // Parse JSONL output
    const commits: GitCommit[] = [];
    for (const line of result.trim().split("\n")) {
      if (line.trim()) {
        try {
          const commit = JSON.parse(line);
          // Only include commits from the date range
          const commitDate = new Date(commit.date).toISOString().split("T")[0];
          if (commitDate >= sinceDate && commitDate <= untilDate) {
            commits.push({
              sha: commit.sha,
              message: commit.message.split("\n")[0], // First line only
              date: commit.date,
              author: commit.author || githubUsername,
            });
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
    return commits;
  } catch (error) {
    console.error(`Error fetching commits for ${githubUsername}:`, error);
    return [];
  }
}

/**
 * Get all commits for a specific date using GitHub API
 * @param targetDate - The date to get commits for (defaults to yesterday Jakarta time)
 */
export async function getCommitsForDate(targetDate?: Date): Promise<{ date: Date; commits: Map<string, GitCommit[]> }> {
  // Use Jakarta timezone (UTC+7) for date boundaries
  const jakartaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Default to yesterday in Jakarta
  const dateToUse = targetDate ?? (() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  })();

  const [year, month, day] = jakartaFormatter.format(dateToUse).split("-").map(Number);

  // Target date 00:00:00 Jakarta
  const since = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`).toISOString();
  // Target date 23:59:59 Jakarta
  const until = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T23:59:59+07:00`).toISOString();

  const commitsByAuthor = new Map<string, GitCommit[]>();

  try {
    const result = execSync(
      `gh api "repos/${REPO}/commits?since=${since}&until=${until}&per_page=100" --jq '.[] | {sha: .sha[0:7], message: .commit.message, date: .commit.author.date, author: (.author.login // .commit.author.name)}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    if (!result.trim()) return commitsByAuthor;

    for (const line of result.trim().split("\n")) {
      if (line.trim()) {
        try {
          const commit = JSON.parse(line);
          const author = commit.author?.toLowerCase() || "unknown";

          if (!commitsByAuthor.has(author)) {
            commitsByAuthor.set(author, []);
          }

          commitsByAuthor.get(author)!.push({
            sha: commit.sha,
            message: commit.message.split("\n")[0],
            date: commit.date,
            author: commit.author,
          });
        } catch {
          // Skip malformed JSON
        }
      }
    }
  } catch (error) {
    console.error("Error fetching commits:", error);
  }

  return { date: dateToUse, commits: commitsByAuthor };
}

/**
 * @deprecated Use getCommitsForDate instead
 */
export async function getAllCommitsYesterday(): Promise<Map<string, GitCommit[]>> {
  const result = await getCommitsForDate();
  return result.commits;
}

/**
 * Format standup report for Telegram
 */
export function formatStandupReport(standups: MemberStandup[], targetDate: Date): string {
  const lines: string[] = [];
  const dateStr = targetDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  });

  lines.push(`📊 *Daily Standup - ${dateStr}*`);
  lines.push("_Timezone: Asia/Jakarta (UTC+7)_");
  lines.push("");

  // Check if member has any activity
  const hasActivity = (s: MemberStandup) =>
    s.commits.length > 0 || s.linear.shipped.length > 0 || s.linear.inProgress.length > 0;

  const activeMembers = standups.filter(hasActivity);
  const inactiveMembers = standups.filter((s) => !hasActivity(s));

  if (activeMembers.length === 0) {
    lines.push("_No activity recorded for this date._");
    return lines.join("\n");
  }

  for (const member of activeMembers) {
    lines.push(`👤 *${member.name}*`);

    // Shipped section: commits + Linear issues completed
    const hasShipped = member.commits.length > 0 || member.linear.shipped.length > 0;
    if (hasShipped) {
      lines.push("  🚀 *Shipped:*");

      // Git commits (with clickable links)
      for (const commit of member.commits.slice(0, 3)) {
        const msg = commit.message.length > 50
          ? commit.message.substring(0, 47) + "..."
          : commit.message;
        const commitUrl = `${GITHUB_BASE}/commit/${commit.sha}`;
        lines.push(`    • [${commit.sha}](${commitUrl}) ${msg}`);
      }
      if (member.commits.length > 3) {
        lines.push(`    _...+${member.commits.length - 3} more commits_`);
      }

      // Linear issues completed (with clickable links)
      for (const issue of member.linear.shipped.slice(0, 3)) {
        const title = issue.title.length > 40
          ? issue.title.substring(0, 37) + "..."
          : issue.title;
        const issueUrl = `${LINEAR_BASE}/${issue.identifier}`;
        lines.push(`    • [${issue.identifier}](${issueUrl}) → Done: ${title}`);
      }
      if (member.linear.shipped.length > 3) {
        lines.push(`    _...+${member.linear.shipped.length - 3} more issues_`);
      }
    }

    // Working On section: Linear issues in progress (with clickable links)
    if (member.linear.inProgress.length > 0) {
      lines.push("  🔨 *Working On:*");
      for (const issue of member.linear.inProgress.slice(0, 3)) {
        const title = issue.title.length > 40
          ? issue.title.substring(0, 37) + "..."
          : issue.title;
        const status = issue.state === "In Review" ? " (Review)" : "";
        const issueUrl = `${LINEAR_BASE}/${issue.identifier}`;
        lines.push(`    • [${issue.identifier}](${issueUrl}): ${title}${status}`);
      }
      if (member.linear.inProgress.length > 3) {
        lines.push(`    _...+${member.linear.inProgress.length - 3} more_`);
      }
    }

    lines.push("");
  }

  if (inactiveMembers.length > 0) {
    lines.push("_No recorded activity:_");
    lines.push(inactiveMembers.map((m) => m.name).join(", "));
  }

  return lines.join("\n");
}

/**
 * Parse a date string like "yesterday", "today", "2026-01-02", "jan 2"
 */
export function parseStandupDate(input: string): Date | null {
  const lower = input.toLowerCase().trim();

  if (lower === "yesterday") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }

  if (lower === "today") {
    return new Date();
  }

  // Try ISO format: 2026-01-02
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) {
    return new Date(`${lower}T12:00:00+07:00`);
  }

  // Try "jan 2" or "january 2" format
  const monthMatch = lower.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})$/);
  if (monthMatch) {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const month = months[monthMatch[1]];
    const day = parseInt(monthMatch[2]);
    let year = new Date().getFullYear();

    // If the date would be in the future, use previous year
    const candidate = new Date(year, month, day, 12, 0, 0);
    if (candidate > new Date()) {
      year--;
    }
    return new Date(year, month, day, 12, 0, 0);
  }

  return null;
}

/**
 * Generate full standup report
 * @param targetDate - The date to generate standup for (defaults to yesterday)
 */
export async function generateStandup(targetDate?: Date): Promise<string> {
  // Debug: log API key status (now evaluated after dotenv loaded)
  const apiKey = getLinearApiKey();
  console.log(`[Standup] Linear API key: ${apiKey ? "configured ✓" : "NOT configured"}`);

  console.log("[Standup] Fetching commits from GitHub...");
  const { date, commits: commitsByAuthor } = await getCommitsForDate(targetDate);

  console.log("[Standup] Fetching Linear activity for all members in parallel...");

  // Fetch Linear activity for ALL members in parallel
  const linearActivities = await Promise.all(
    TEAM_MEMBERS.map(member => getLinearActivity(member.linear, date))
  );

  // Combine commits and Linear activity
  const standups: MemberStandup[] = TEAM_MEMBERS.map((member, index) => {
    const githubLower = member.github.toLowerCase();
    return {
      name: member.name,
      github: member.github,
      commits: commitsByAuthor.get(githubLower) || [],
      linear: linearActivities[index],
    };
  });

  return formatStandupReport(standups, date);
}
