import { exec } from "child_process";
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
    // Build command with absolute path
    const escapedPrompt = prompt.replace(/'/g, "'\\''");
    const cmd = sessionId
      ? `'${CLAUDE_PATH}' -p '${escapedPrompt}' --output-format json --resume '${sessionId}'`
      : `'${CLAUDE_PATH}' -p '${escapedPrompt}' --output-format json`;

    console.log(`[Claude] Command: ${cmd.substring(0, 100)}...`);

    exec(cmd, { cwd: workingDir, maxBuffer: 10 * 1024 * 1024, timeout: 120000 }, (error, stdout, stderr) => {
      console.log(`[Claude] Completed. stdout length: ${stdout.length}`);
      if (stderr) console.log(`[Claude] stderr: ${stderr}`);
      if (error) console.log(`[Claude] error: ${error.message}`);

      if (error) {
        resolve({
          response: `Error: ${error.message}`,
          error: error.message,
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        const newSessionId = parsed.session_id;

        if (newSessionId) {
          sessions.set(userId, newSessionId);
        }

        console.log(`[Claude] Response length: ${(parsed.result || "").length}`);

        resolve({
          response: parsed.result || stdout,
          sessionId: newSessionId,
        });
      } catch {
        console.log(`[Claude] Non-JSON: ${stdout.substring(0, 100)}`);
        resolve({ response: stdout || "No response from Claude" });
      }
    });
  });
}

export function clearSession(userId: number): void {
  sessions.delete(userId);
}
