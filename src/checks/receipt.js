import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { overallStatus } from "../verdict.js";

export function writeReceipt({ path, claim, checks, workspace, writtenAt }) {
  const payload = {
    version: 1,
    tool: "workproof",
    workspace,
    writtenAt: writtenAt ?? new Date().toISOString(),
    claim,
    checks,
    overall: overallStatus(checks),
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

export function readReceipt(path) {
  const payload = JSON.parse(readFileSync(path, "utf8"));
  if (!payload || typeof payload !== "object") {
    throw new Error("receipt is not an object");
  }
  return payload;
}

function verdictsMatch(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }
  return left.every((check, i) => {
    const other = right[i];
    return check.name === other.name && check.status === other.status && check.reason === other.reason;
  });
}

export function checkReceipt({ workspace, claim, priorChecks, receiptPath }) {
  try {
    const written = writeReceipt({
      path: receiptPath,
      claim,
      checks: priorChecks,
      workspace,
    });
    const reread = readReceipt(receiptPath);
    const same =
      verdictsMatch(reread.checks, priorChecks) && reread.overall === written.overall;
    if (!same) {
      return {
        name: "receipt",
        status: "FAIL",
        reason: "receipt did not round-trip",
        detail: { path: receiptPath },
      };
    }
    return {
      name: "receipt",
      status: "PASS",
      reason: `wrote ${receiptPath}`,
      detail: { path: receiptPath, overall: written.overall },
    };
  } catch (error) {
    return {
      name: "receipt",
      status: "FAIL",
      reason: `cannot write receipt: ${error.message}`,
    };
  }
}
