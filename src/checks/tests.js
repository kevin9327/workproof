export function parseTestOutput(stdout, stderr, exitCode) {
  const text = `${stdout}\n${stderr}`;
  const passed = matchCount(text, /(?:^|\n)(?:[ℹi]\s+|#\s*)?pass(?:ed)?\s+(\d+)/i);
  const failed = matchCount(text, /(?:^|\n)(?:[ℹi]\s+|#\s*)?fail(?:ed)?\s+(\d+)/i);
  const total = matchCount(text, /(?:^|\n)(?:[ℹi]\s+|#\s*)?tests?\s+(\d+)/i);
  return {
    exitCode,
    passed,
    failed,
    total,
    ok: exitCode === 0,
  };
}

function matchCount(text, pattern) {
  const match = text.match(pattern);
  return match ? Number(match[1]) : null;
}

function summarize(parsed) {
  if (parsed.failed > 0) {
    return `${parsed.failed} failed`;
  }
  if (parsed.passed != null) {
    return `${parsed.passed} passed`;
  }
  if (parsed.ok) return "runner exited 0";
  return `runner exited ${parsed.exitCode}`;
}

export async function checkTests({ workspace, claim, runCommand }) {
  const spec = claim?.tests;
  if (!spec || !Array.isArray(spec.command) || spec.command.length === 0) {
    return {
      name: "tests",
      status: "FAIL",
      reason: "no test command cited",
    };
  }

  const expect = spec.expect ?? "pass";
  let result;
  try {
    result = await runCommand(spec.command, { cwd: workspace });
  } catch (error) {
    return {
      name: "tests",
      status: "FAIL",
      reason: `cannot invoke test runner: ${error.message}`,
    };
  }

  if (result.error && result.error.code === "ENOENT") {
    return {
      name: "tests",
      status: "FAIL",
      reason: `cannot invoke test runner: ${spec.command[0]} not found`,
    };
  }

  const parsed = parseTestOutput(result.stdout, result.stderr, result.exitCode);
  const reproducedPass = parsed.ok;
  const claimedPass = expect === "pass";

  if (claimedPass && !reproducedPass) {
    return {
      name: "tests",
      status: "FAIL",
      reason: summarize(parsed),
      detail: parsed,
    };
  }
  if (!claimedPass && reproducedPass) {
    return {
      name: "tests",
      status: "FAIL",
      reason: "suite passed but claim expected fail",
      detail: parsed,
    };
  }
  return {
    name: "tests",
    status: "PASS",
    reason: summarize(parsed),
    detail: parsed,
  };
}
