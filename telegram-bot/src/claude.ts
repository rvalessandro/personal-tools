import { spawn } from "child_process";

interface ClaudeResult {
  response: string;
  sessionId?: string;
  error?: string;
}

// In-memory session store (per Telegram user)
const sessions = new Map<number, string>();

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

  return new Promise((resolve) => {
    const claude = spawn("claude", args, {
      cwd: workingDir,
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    claude.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    claude.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    claude.on("close", (code) => {
      if (code !== 0) {
        resolve({
          response: `Error: ${stderr || "Claude exited with code " + code}`,
          error: stderr,
        });
        return;
      }

      try {
        // Parse JSON response from Claude
        const parsed = JSON.parse(stdout);
        const newSessionId = parsed.session_id;

        // Store session for continuity
        if (newSessionId) {
          sessions.set(userId, newSessionId);
        }

        resolve({
          response: parsed.result || stdout,
          sessionId: newSessionId,
        });
      } catch {
        // If not JSON, return raw output
        resolve({ response: stdout });
      }
    });

    claude.on("error", (err) => {
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
