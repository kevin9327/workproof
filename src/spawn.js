import { spawn } from "node:child_process";

export function resolveCommand(command) {
  if (!Array.isArray(command) || command.length === 0) return [];
  const argv = command.map(String);
  if (argv[0] === "node") argv[0] = process.execPath;
  return argv;
}

function childEnv() {
  const env = { ...process.env };
  // A parent `node --test` sets this and would swallow a nested runner.
  delete env.NODE_TEST_CONTEXT;
  return env;
}

export function runCommand(command, { cwd, timeoutMs = 30_000 } = {}) {
  return new Promise((resolve) => {
    const argv = resolveCommand(command);
    if (!argv.length) {
      resolve({
        exitCode: 1,
        stdout: "",
        stderr: "empty command",
        error: new Error("empty command"),
      });
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;
    let child;
    try {
      child = spawn(argv[0], argv.slice(1), {
        cwd,
        env: childEnv(),
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      resolve({ exitCode: 1, stdout: "", stderr: String(error.message || error), error });
      return;
    }

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        // ignore
      }
      finish({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\nworkproof: test runner timed out`,
        error: new Error("timeout"),
      });
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      finish({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${error.message}`,
        error,
      });
    });
    child.on("close", (code) => {
      finish({ exitCode: code ?? 1, stdout, stderr, error: null });
    });

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    }
  });
}
