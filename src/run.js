import { existsSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { loadClaim } from "./claim.js";
import { checkTests } from "./checks/tests.js";
import { checkDiff } from "./checks/diff.js";
import { checkScreenshot } from "./checks/screenshot.js";
import { checkReceipt } from "./checks/receipt.js";
import { formatReport } from "./format.js";
import { exitCodeFor, overallStatus } from "./verdict.js";
import { runCommand as defaultRunCommand } from "./spawn.js";

function resolveReceiptPath(workspace, explicit) {
  if (!explicit) return join(workspace, ".workproof", "receipt.json");
  return isAbsolute(explicit) ? explicit : join(workspace, explicit);
}

function displayPath(workspace, absPath) {
  const rel = relative(workspace, absPath);
  if (!rel || rel.startsWith("..")) return absPath;
  return rel.replaceAll("\\", "/");
}

export async function runWorkproof({
  workspace,
  claimPath,
  receiptPath,
  runCommand = defaultRunCommand,
} = {}) {
  const root = resolve(workspace ?? process.cwd());
  if (!existsSync(root)) {
    const checks = [
      { name: "tests", status: "FAIL", reason: `workspace not found: ${root}` },
      { name: "diff", status: "FAIL", reason: `workspace not found: ${root}` },
      { name: "screenshot", status: "FAIL", reason: `workspace not found: ${root}` },
      { name: "receipt", status: "FAIL", reason: `workspace not found: ${root}` },
    ];
    const overall = "FAIL";
    return {
      checks,
      overall,
      exitCode: 1,
      output: formatReport({ checks, overall }),
    };
  }

  let loaded;
  try {
    loaded = loadClaim(root, claimPath);
  } catch (error) {
    const checks = [
      { name: "tests", status: "FAIL", reason: error.message },
      { name: "diff", status: "FAIL", reason: error.message },
      { name: "screenshot", status: "FAIL", reason: error.message },
      { name: "receipt", status: "FAIL", reason: error.message },
    ];
    const overall = "FAIL";
    return {
      checks,
      overall,
      exitCode: 1,
      output: formatReport({ checks, overall }),
    };
  }

  const tests = await checkTests({
    workspace: root,
    claim: loaded.claim,
    runCommand,
  });
  const diff = checkDiff({ workspace: root, claim: loaded.claim });
  const screenshot = checkScreenshot({ workspace: root, claim: loaded.claim });
  const prior = [tests, diff, screenshot];

  const absReceipt = resolveReceiptPath(root, receiptPath);
  const receipt = checkReceipt({
    workspace: root,
    claim: loaded.claim,
    priorChecks: prior,
    receiptPath: absReceipt,
  });
  if (receipt.status === "PASS") {
    receipt.reason = `wrote ${displayPath(root, absReceipt)}`;
  }

  const checks = [...prior, receipt];
  const overall = overallStatus(checks);
  return {
    workspace: root,
    claimPath: loaded.path,
    receiptPath: absReceipt,
    claim: loaded.claim,
    checks,
    overall,
    exitCode: exitCodeFor(overall),
    output: formatReport({ checks, overall }),
  };
}
