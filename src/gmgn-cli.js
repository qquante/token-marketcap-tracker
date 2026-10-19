import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

export async function runGmgnCli(args, options = {}) {
  const command = resolveGmgnCommand();
  const childArgs = [...command.argsPrefix, ...args];

  const result = await execFile(command.bin, childArgs, {
    cwd: projectRoot,
    env: process.env,
    timeoutMs: options.timeoutMs ?? 45_000,
  });

  if (result.exitCode !== 0) {
    const message = [
      `gmgn-cli failed with exit code ${result.exitCode}`,
      result.stderr.trim(),
      result.stdout.trim(),
    ].filter(Boolean).join("\n");
    const error = new Error(message);
    error.stdout = result.stdout;
    error.stderr = result.stderr;
    error.exitCode = result.exitCode;
    throw error;
  }

  return parseJsonOutput(result.stdout);
}

function resolveGmgnCommand() {
  const localEntry = resolve(projectRoot, "node_modules", "gmgn-cli", "dist", "index.js");
  if (existsSync(localEntry)) {
    return { bin: process.execPath, argsPrefix: [localEntry] };
  }
  if (process.platform === "win32") {
    return { bin: "cmd.exe", argsPrefix: ["/d", "/s", "/c", "npx.cmd", "--yes", "gmgn-cli"] };
  }
  return { bin: "npx", argsPrefix: ["--yes", "gmgn-cli"] };
}

function execFile(command, args, options) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Command timed out after ${options.timeoutMs}ms: ${command}`));
    }, options.timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolvePromise({ exitCode, stdout, stderr });
    });
  });
}

function parseJsonOutput(stdout) {
  const text = stdout.trim();
  if (!text) {
    throw new Error("gmgn-cli returned empty stdout.");
  }
  try {
    return JSON.parse(text);
  } catch (firstError) {
    const jsonLine = text.split(/\r?\n/).reverse().find((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith("{") || trimmed.startsWith("[");
    });
    if (!jsonLine) {
      throw firstError;
    }
    return JSON.parse(jsonLine);
  }
}
