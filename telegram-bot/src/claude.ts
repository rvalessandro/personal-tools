import { spawn } from "child_process";
import { homedir } from "os";
import { join } from "path";

interface ClaudeResult {
  response: string;
  sessionId?: string;
  error?: string;
}

// Progress callback type
export type ProgressCallback = (message: string) => void;

// In-memory session store (per Telegram user)
const sessions = new Map<number, string>();

// Config getters (evaluated lazily after dotenv loads)
const getClaudePath = () => process.env.CLAUDE_PATH || join(homedir(), ".local/bin/claude");
const getClaudeTimeout = () => parseInt(process.env.CLAUDE_TIMEOUT || "300000", 10);
const getClaudeModel = () => process.env.CLAUDE_MODEL || "sonnet";

// Tool patterns to match in stderr (Claude CLI outputs tool usage)
const TOOL_PATTERNS: { pattern: RegExp; emoji: string; label: string }[] = [
  { pattern: /Read\(|Reading/i, emoji: "📖", label: "Reading file" },
  { pattern: /Glob\(|Globbing/i, emoji: "🔍", label: "Finding files" },
  { pattern: /Grep\(|Searching/i, emoji: "🔎", label: "Searching code" },
  { pattern: /Bash\(|Running/i, emoji: "⚡", label: "Running command" },
  { pattern: /Edit\(|Editing/i, emoji: "✏️", label: "Editing file" },
  { pattern: /Write\(|Writing/i, emoji: "📝", label: "Writing file" },
  { pattern: /WebFetch|Fetching/i, emoji: "🌐", label: "Fetching URL" },
  { pattern: /WebSearch/i, emoji: "🔍", label: "Searching web" },
  { pattern: /Task\(|Agent/i, emoji: "🤖", label: "Running agent" },
  { pattern: /mcp__.*linear/i, emoji: "📋", label: "Linear" },
  { pattern: /mcp__.*signoz/i, emoji: "📊", label: "SigNoz" },
];

// Debounce interval in ms
const DEBOUNCE_INTERVAL = 5000;

function parseToolFromStderr(text: string): string | null {
  for (const { pattern, emoji, label } of TOOL_PATTERNS) {
    if (pattern.test(text)) {
      return `${emoji} ${label}...`;
    }
  }
  return null;
}

export async function askClaude(
  userId: number,
  prompt: string,
  workingDir: string,
  onProgress?: ProgressCallback
): Promise<ClaudeResult> {
  const sessionId = sessions.get(userId);

  const claudePath = getClaudePath();
  const claudeTimeout = getClaudeTimeout();
  const claudeModel = getClaudeModel();

  console.log(`[Claude] Path: ${claudePath}, Model: ${claudeModel}, Timeout: ${claudeTimeout / 1000}s`);
  console.log(`[Claude] Working dir: ${workingDir}`);

  return new Promise((resolve) => {
    // Build args array
    const args = [
      "-p", prompt,
      "--output-format", "json",
      "--dangerously-skip-permissions",
      "--model", claudeModel,
    ];
    if (sessionId) {
      args.push("--resume", sessionId);
    }

    console.log(`[Claude] Spawning: ${claudePath} with args:`, args.slice(0, 3));

    const env = {
      ...process.env,
      HOME: homedir(),
      PATH: `${join(homedir(), ".local/bin")}:${process.env.PATH}`,
    };

    const child = spawn(claudePath, args, {
      cwd: workingDir,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let lastProgressTime = 0;
    let lastProgressMessage = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;

      // Parse and emit progress if callback provided
      if (onProgress) {
        const progress = parseToolFromStderr(chunk);
        const now = Date.now();

        // Debounce: only send if different message or enough time passed
        if (progress && (progress !== lastProgressMessage || now - lastProgressTime >= DEBOUNCE_INTERVAL)) {
          lastProgressTime = now;
          lastProgressMessage = progress;
          onProgress(progress);
        }
      }
    });

    const timeout = setTimeout(() => {
      console.log(`[Claude] Timeout after ${claudeTimeout / 1000}s - killing`);
      child.kill("SIGTERM");
    }, claudeTimeout);

    child.on("close", (code) => {
      clearTimeout(timeout);
      console.log(`[Claude] Exit code: ${code}, stdout: ${stdout.length}, stderr: ${stderr.length}`);
      if (stderr) console.log(`[Claude] stderr: ${stderr.substring(0, 200)}`);

      if (code !== 0) {
        resolve({
          response: `Error: Claude exited with code ${code}. ${stderr}`,
          error: stderr,
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        const newSessionId = parsed.session_id;

        if (newSessionId) {
          sessions.set(userId, newSessionId);
        }

        console.log(`[Claude] Response: ${(parsed.result || "").substring(0, 100)}...`);

        resolve({
          response: parsed.result || stdout,
          sessionId: newSessionId,
        });
      } catch {
        console.log(`[Claude] Non-JSON: ${stdout.substring(0, 100)}`);
        resolve({ response: stdout || "No response from Claude" });
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      console.log(`[Claude] Spawn error: ${err.message}`);
      resolve({
        response: `Failed to start Claude: ${err.message}`,
        error: err.message,
      });
    });
  });
}

export function clearSession(userId: number): void {
  sessions.delete(userId);
}
