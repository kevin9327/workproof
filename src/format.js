import { passedCount } from "./verdict.js";

const ANSI = {
  PASS: "\u001b[32m",
  FAIL: "\u001b[31m",
  SKIP: "\u001b[33m",
  reset: "\u001b[0m",
};

export function formatCheck(check, { color = false } = {}) {
  const raw = check.status.padEnd(4, " ");
  const status = color ? `${ANSI[check.status] ?? ""}${raw}${ANSI.reset}` : raw;
  const name = check.name.padEnd(11, " ");
  return `${status} ${name}${check.reason}`;
}

export function formatReport({ checks, overall, color = false }) {
  const lines = checks.map((check) => formatCheck(check, { color }));
  const passed = passedCount(checks);
  lines.push("");
  lines.push(`workproof: ${passed}/${checks.length} checks passed`);
  if (overall === "FAIL") {
    const failLine = "workproof: FAIL — a cited claim could not be reproduced";
    lines.push(color ? `${ANSI.FAIL}${failLine}${ANSI.reset}` : failLine);
  }
  return `${lines.join("\n")}\n`;
}

export function formatJson({ checks, overall, exitCode, workspace, claimPath, receiptPath }) {
  return `${JSON.stringify(
    { overall, exitCode, workspace, claimPath, receiptPath, checks },
    null,
    2,
  )}\n`;
}
