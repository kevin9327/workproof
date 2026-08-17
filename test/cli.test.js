import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "bin", "workproof.js");

function run(args, extra = {}) {
  return spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    cwd: root,
    ...extra,
  });
}

test("CLI entry catches a false claimed file edit", () => {
  const result = run(["--workspace", join(root, "examples", "caught")]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /PASS\s+tests/);
  assert.match(result.stdout, /FAIL\s+diff/);
  assert.match(result.stdout, /SKIP\s+screenshot/);
  assert.match(result.stdout, /PASS\s+receipt/);
  assert.match(result.stdout, /claimed edit not on disk: src\/fixed\.js/);
  assert.match(result.stdout, /workproof: FAIL/);
});

test("CLI entry passes a clean claimed workspace", () => {
  const result = run(["--workspace", join(root, "examples", "clean")]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /PASS\s+tests/);
  assert.match(result.stdout, /PASS\s+diff/);
  assert.match(result.stdout, /PASS\s+screenshot/);
  assert.match(result.stdout, /PASS\s+receipt/);
  assert.match(result.stdout, /4\/4 checks passed/);
});

test("CLI --help prints the documented entry point", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /node bin\/workproof\.js/);
});

test("README run command and sample match a real CLI invocation", async () => {
  const { readFileSync } = await import("node:fs");
  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.match(readme, /node bin\/workproof\.js --workspace examples\/caught/);
  const result = run(["--workspace", "examples/caught"]);
  assert.notEqual(result.status, 0);
  const expected = [
    "PASS tests      1 passed",
    "FAIL diff       claimed edit not on disk: src/fixed.js",
    "SKIP screenshot no capture at shots/login.png",
    "PASS receipt    wrote .workproof/receipt.json",
    "workproof: 2/4 checks passed",
    "workproof: FAIL — a cited claim could not be reproduced",
  ];
  for (const line of expected) {
    assert.ok(readme.includes(line), `README missing: ${line}`);
    assert.ok(result.stdout.includes(line), `CLI missing: ${line}`);
  }
});
