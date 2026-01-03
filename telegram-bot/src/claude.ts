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

// System prompt for parallelization and efficiency
const SYSTEM_PROMPT = `When handling requests with multiple items (e.g., "create 3 calendar events", "mark 3 todos done", "check 5 PRs"):
- Make all independent tool calls in PARALLEL (single message with multiple tool uses)
- Don't process items sequentially when they can run concurrently
- Group similar operations together for efficiency`;

// Tool name to emoji/label mapping
const TOOL_LABELS: Record<string, { emoji: string; label: string }> = {
  Read: { emoji: "📖", label: "Reading file" },
  Glob: { emoji: "🔍", label: "Finding files" },
  Grep: { emoji: "🔎", label: "Searching code" },
  Bash: { emoji: "⚡", label: "Running command" },
  Edit: { emoji: "✏️", label: "Editing file" },
  Write: { emoji: "📝", label: "Writing file" },
  WebFetch: { emoji: "🌐", label: "Fetching URL" },
  WebSearch: { emoji: "🔍", label: "Searching web" },
  Task: { emoji: "🤖", label: "Running agent" },
  TodoWrite: { emoji: "📋", label: "Updating tasks" },
  LSP: { emoji: "🔗", label: "Code navigation" },
};

// Debounce interval in ms
const DEBOUNCE_INTERVAL = 5000;

function getToolLabel(toolName: string): string | null {
  // Check exact match first
  if (TOOL_LABELS[toolName]) {
    const { emoji, label } = TOOL_LABELS[toolName];
    return `${emoji} ${label}...`;
  }

  // Check for MCP tools (mcp__server__tool format)
  if (toolName.startsWith("mcp__")) {
    const parts = toolName.split("__");
    if (parts.length >= 2) {
      const server = parts[1];
      if (server.includes("linear")) return "📋 Linear...";
      if (server.includes("signoz")) return "📊 SigNoz...";
      if (server.includes("metabase")) return "📈 Metabase...";
      return `🔌 ${server}...`;
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
    // Build args array - use stream-json for progress updates
    const args = [
      "-p", prompt,
      "-s", SYSTEM_PROMPT,
      "--output-format", "stream-json",
      "--verbose",
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

    let buffer = "";
    let stderr = "";
    let lastProgressTime = 0;
    let lastProgressMessage = "";
    let finalResult: ClaudeResult | null = null;

    child.stdout.on("data", (data) => {
      buffer += data.toString();

      // Process complete JSON lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const event = JSON.parse(line);

          // Handle tool use events for progress
          if (event.type === "assistant" && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === "tool_use" && onProgress) {
                const toolLabel = getToolLabel(block.name);
                const now = Date.now();

                // Debounce: only send if different message or enough time passed
                if (toolLabel && (toolLabel !== lastProgressMessage || now - lastProgressTime >= DEBOUNCE_INTERVAL)) {
                  lastProgressTime = now;
                  lastProgressMessage = toolLabel;
                  console.log(`[Claude] Progress: ${toolLabel}`);
                  onProgress(toolLabel);
                }
              }
            }
          }

          // Capture final result
          if (event.type === "result") {
            const newSessionId = event.session_id;
            if (newSessionId) {
              sessions.set(userId, newSessionId);
            }

            finalResult = {
              response: event.result || "No response from Claude",
              sessionId: newSessionId,
              error: event.is_error ? event.result : undefined,
            };
          }
        } catch {
          // Ignore JSON parse errors for incomplete lines
        }
      }
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      console.log(`[Claude] Timeout after ${claudeTimeout / 1000}s - killing`);
      child.kill("SIGTERM");
    }, claudeTimeout);

    child.on("close", (code) => {
      clearTimeout(timeout);
      console.log(`[Claude] Exit code: ${code}, stderr: ${stderr.length}`);
      if (stderr) console.log(`[Claude] stderr: ${stderr.substring(0, 200)}`);

      if (finalResult) {
        console.log(`[Claude] Response: ${(finalResult.response || "").substring(0, 100)}...`);
        resolve(finalResult);
      } else if (code !== 0) {
        resolve({
          response: `Error: Claude exited with code ${code}. ${stderr}`,
          error: stderr,
        });
      } else {
        resolve({ response: "No response from Claude" });
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
