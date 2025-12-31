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

// Find claude binary - check nvm path first
const NVM_BIN = join(homedir(), ".nvm/versions/node", process.version, "bin");

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
    const claude = spawn("claude", args, {
      cwd: workingDir,
      env: {
        ...process.env,
        PATH: `${NVM_BIN}:${process.env.PATH}`,
      },
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
      console.log(`[Claude] Exit code: ${code}`);
      console.log(`[Claude] stdout length: ${stdout.length}`);
      if (stderr) console.log(`[Claude] stderr: ${stderr}`);

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

        console.log(`[Claude] Response length: ${(parsed.result || "").length}`);

        resolve({
          response: parsed.result || stdout,
          sessionId: newSessionId,
        });
      } catch {
        // If not JSON, return raw output
        console.log(`[Claude] Non-JSON response: ${stdout.substring(0, 100)}`);
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
