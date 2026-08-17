import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  checkDiff,
  checkReceipt,
  checkScreenshot,
  checkTests,
  parseTestOutput,
  readReceipt,
} from "../src/index.js";
import { runCommand } from "../src/spawn.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const testdata = join(root, "testdata");

function loadClaim(dir) {
  return JSON.parse(readFileSync(join(testdata, dir, "claim.json"), "utf8"));
}

test("parseTestOutput reads node:test pass/fail counts", () => {
  const parsed = parseTestOutput(
    "✔ ok\nℹ tests 2\nℹ pass 1\nℹ fail 1\n",
    "",
    1,
  );
  assert.equal(parsed.total, 2);
  assert.equal(parsed.passed, 1);
  assert.equal(parsed.failed, 1);
  assert.equal(parsed.ok, false);
});

test("checkTests PASS when the cited runner actually passes", async () => {
  const workspace = join(testdata, "tests-pass");
  const verdict = await checkTests({
    workspace,
    claim: loadClaim("tests-pass"),
    runCommand,
  });
  assert.equal(verdict.name, "tests");
  assert.equal(verdict.status, "PASS");
  assert.match(verdict.reason, /passed/);
  assert.equal(verdict.detail.ok, true);
});

test("checkTests FAIL when the cited runner fails a claimed pass", async () => {
  const workspace = join(testdata, "tests-fail");
  const verdict = await checkTests({
    workspace,
    claim: loadClaim("tests-fail"),
    runCommand,
  });
  assert.equal(verdict.name, "tests");
  assert.equal(verdict.status, "FAIL");
  assert.equal(verdict.detail.ok, false);
});

test("checkTests FAIL when no test command is cited", async () => {
  const verdict = await checkTests({
    workspace: testdata,
    claim: {},
    runCommand,
  });
  assert.equal(verdict.status, "FAIL");
  assert.match(verdict.reason, /no test command cited/);
});

test("checkTests FAIL when the cited runner cannot be invoked", async () => {
  const verdict = await checkTests({
    workspace: testdata,
    claim: {
      tests: { command: ["workproof-missing-runner-xyz"], expect: "pass" },
    },
    runCommand,
  });
  assert.equal(verdict.status, "FAIL");
  assert.match(verdict.reason, /cannot invoke test runner/);
});

test("checkDiff PASS when claimed file exists with expected content", () => {
  const verdict = checkDiff({
    workspace: join(testdata, "diff-match"),
    claim: loadClaim("diff-match"),
  });
  assert.equal(verdict.status, "PASS");
  assert.match(verdict.reason, /1 file match/);
});

test("checkDiff FAIL when claimed edit is not on disk", () => {
  const verdict = checkDiff({
    workspace: join(testdata, "diff-miss"),
    claim: loadClaim("diff-miss"),
  });
  assert.equal(verdict.status, "FAIL");
  assert.match(verdict.reason, /claimed edit not on disk: src\/fixed\.js/);
});

test("checkDiff FAIL when file matches the before snapshot", () => {
  const verdict = checkDiff({
    workspace: join(testdata, "diff-unchanged"),
    claim: loadClaim("diff-unchanged"),
  });
  assert.equal(verdict.status, "FAIL");
  assert.match(verdict.reason, /unchanged from before snapshot/);
});

test("checkScreenshot SKIP when capture is absent and not required", () => {
  const verdict = checkScreenshot({
    workspace: join(testdata, "shot-skip"),
    claim: loadClaim("shot-skip"),
  });
  assert.equal(verdict.status, "SKIP");
  assert.match(verdict.reason, /no capture at shots\/login\.png/);
});

test("checkScreenshot FAIL when capture is absent and required", () => {
  const verdict = checkScreenshot({
    workspace: join(testdata, "shot-fail"),
    claim: loadClaim("shot-fail"),
  });
  assert.equal(verdict.status, "FAIL");
  assert.match(verdict.reason, /no capture at shots\/login\.png/);
});

test("checkScreenshot PASS when a real image capture exists", () => {
  const verdict = checkScreenshot({
    workspace: join(testdata, "shot-pass"),
    claim: loadClaim("shot-pass"),
  });
  assert.equal(verdict.status, "PASS");
  assert.match(verdict.reason, /png capture/);
});

test("receipt round-trips the same verdicts when re-read", () => {
  const priorChecks = [
    { name: "tests", status: "PASS", reason: "1 passed" },
    { name: "diff", status: "FAIL", reason: "claimed edit not on disk: src/fixed.js" },
    { name: "screenshot", status: "SKIP", reason: "no capture at shots/login.png" },
  ];
  const dir = mkdtempSync(join(tmpdir(), "workproof-receipt-"));
  const receiptPath = join(dir, "receipt.json");
  const verdict = checkReceipt({
    workspace: dir,
    claim: { note: "fixture" },
    priorChecks,
    receiptPath,
  });
  assert.equal(verdict.status, "PASS");
  const reread = readReceipt(receiptPath);
  assert.deepEqual(
    reread.checks.map((check) => ({
      name: check.name,
      status: check.status,
      reason: check.reason,
    })),
    priorChecks,
  );
  assert.equal(reread.overall, "FAIL");
});
