import { spawn } from "child_process";
import { homedir } from "os";
import { join } from "path";

interface ClaudeResult {
  response: string;
  sessionId?: string;
  error?: string;
}

// In-memory session store (per Telegram user)
const sessions = new Map<number, string>();

// Config getters (evaluated lazily after dotenv loads)
const getClaudePath = () => process.env.CLAUDE_PATH || join(homedir(), ".local/bin/claude");
const getClaudeTimeout = () => parseInt(process.env.CLAUDE_TIMEOUT || "300000", 10);
const getClaudeModel = () => process.env.CLAUDE_MODEL || "sonnet";

export async function askClaude(
  userId: number,
  prompt: string,
  workingDir: string
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

    child.stdout.on("data", (data) => {
      stdout += data.toString();
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
