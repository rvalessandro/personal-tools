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

// Claude binary path
const CLAUDE_PATH = process.env.CLAUDE_PATH || join(homedir(), ".local/bin/claude");

export async function askClaude(
  userId: number,
  prompt: string,
  workingDir: string
): Promise<ClaudeResult> {
  const sessionId = sessions.get(userId);

  const args = ["-p", prompt, "--output-format", "json"];

  // Resume session if exists
  if (sessionId) {
    args.push("--resume", sessionId);
  }

  console.log(`[Claude] Calling with args:`, args.slice(0, 3));
  console.log(`[Claude] Working dir: ${workingDir}`);

  return new Promise((resolve) => {
    // Build args array (no shell)
    const args = [
      "-p", prompt,
      "--output-format", "json",
      "--dangerously-skip-permissions",
    ];
    if (sessionId) {
      args.push("--resume", sessionId);
    }

    console.log(`[Claude] Spawning: ${CLAUDE_PATH} with args:`, args.slice(0, 3));

    const env = {
      ...process.env,
      HOME: homedir(),
      PATH: `${join(homedir(), ".local/bin")}:${process.env.PATH}`,
    };

    const child = spawn(CLAUDE_PATH, args, {
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
      console.log(`[Claude] Timeout - killing`);
      child.kill("SIGTERM");
    }, 60000);

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
