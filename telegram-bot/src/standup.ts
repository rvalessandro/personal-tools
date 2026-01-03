/**
 * Automated Daily Standup Generator
 * Pulls git commits and Linear activity for ReallySick team
 */

import { execSync } from "child_process";

// Team member mapping: GitHub username → Linear email/ID
export const TEAM_MEMBERS = [
  { github: "alvin0727", linear: "alvin.gea@interwise.app", name: "Alvin" },
  { github: "aufaikrimaa", linear: "aufa@interwise.app", name: "Aufa" },
  { github: "jenniferflorentina", linear: "jennifer.florentina@interwise.app", name: "Jennifer" },
  { github: "Jhonhazel", linear: "hazel@interwise.app", name: "Hazel" },
  { github: "K3vinTNR", linear: "kevin.taniar@interwise.app", name: "Kevin" },
  { github: "vincentbmw", linear: "vincent.benedict@interwise.app", name: "Vincent" },
];

const REPO = "See-Dr-Pte-Ltd/reallysick-monorepo";

export interface GitCommit {
  sha: string;
  message: string;
  date: string;
  author: string;
}

export interface LinearActivity {
  type: "issue_created" | "issue_updated" | "comment" | "status_change";
  title: string;
  identifier: string;
  description?: string;
}

export interface MemberStandup {
  name: string;
  github: string;
  commits: GitCommit[];
  linearActivity: LinearActivity[];
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
 * Get all commits from yesterday using GitHub API
 */
export async function getAllCommitsYesterday(): Promise<Map<string, GitCommit[]>> {
  // Use Jakarta timezone (UTC+7) for date boundaries
  const jakartaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Get yesterday's date in Jakarta
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const [year, month, day] = jakartaFormatter.format(yesterday).split("-").map(Number);

  // Yesterday 00:00:00 Jakarta = UTC-7 hours
  const since = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`).toISOString();
  // Yesterday 23:59:59 Jakarta
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

  return commitsByAuthor;
}

/**
 * Format standup report for Telegram
 */
export function formatStandupReport(standups: MemberStandup[]): string {
  const lines: string[] = [];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  });

  lines.push(`📊 *Daily Standup - ${dateStr}*`);
  lines.push("");

  // Filter members with activity
  const activeMembers = standups.filter(
    (s) => s.commits.length > 0 || s.linearActivity.length > 0
  );
  const inactiveMembers = standups.filter(
    (s) => s.commits.length === 0 && s.linearActivity.length === 0
  );

  if (activeMembers.length === 0) {
    lines.push("_No activity recorded yesterday._");
    return lines.join("\n");
  }

  for (const member of activeMembers) {
    lines.push(`👤 *${member.name}*`);

    if (member.commits.length > 0) {
      lines.push("  📝 Commits:");
      for (const commit of member.commits.slice(0, 5)) {
        const msg = commit.message.length > 60
          ? commit.message.substring(0, 57) + "..."
          : commit.message;
        lines.push(`    • \`${commit.sha}\` ${msg}`);
      }
      if (member.commits.length > 5) {
        lines.push(`    _...and ${member.commits.length - 5} more_`);
      }
    }

    if (member.linearActivity.length > 0) {
      lines.push("  📋 Linear:");
      for (const activity of member.linearActivity.slice(0, 5)) {
        const prefix = activity.type === "issue_created" ? "+" : "→";
        lines.push(`    ${prefix} ${activity.identifier}: ${activity.title}`);
      }
      if (member.linearActivity.length > 5) {
        lines.push(`    _...and ${member.linearActivity.length - 5} more_`);
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
 * Generate full standup report
 */
export async function generateStandup(): Promise<string> {
  console.log("[Standup] Fetching commits from GitHub...");
  const commitsByAuthor = await getAllCommitsYesterday();

  console.log("[Standup] Building standup data...");
  const standups: MemberStandup[] = [];

  for (const member of TEAM_MEMBERS) {
    const githubLower = member.github.toLowerCase();
    const commits = commitsByAuthor.get(githubLower) || [];

    // Linear activity will be added via MCP in the command handler
    standups.push({
      name: member.name,
      github: member.github,
      commits,
      linearActivity: [], // Populated by command handler
    });
  }

  return formatStandupReport(standups);
}
