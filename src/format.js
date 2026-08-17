import { passedCount } from "./verdict.js";

export function formatCheck(check) {
  const status = check.status.padEnd(4, " ");
  const name = check.name.padEnd(11, " ");
  return `${status} ${name}${check.reason}`;
}

export function formatReport({ checks, overall }) {
  const lines = checks.map(formatCheck);
  const passed = passedCount(checks);
  lines.push("");
  lines.push(`workproof: ${passed}/${checks.length} checks passed`);
  if (overall === "FAIL") {
    lines.push("workproof: FAIL — a cited claim could not be reproduced");
  }
  return `${lines.join("\n")}\n`;
}
