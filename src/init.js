import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const DEFAULT_CLAIM = {
  tests: {
    command: ["node", "--test"],
    expect: "pass",
  },
  diff: {
    files: [{ path: "src/index.js", op: "modify" }],
  },
  screenshot: {
    path: "shots/app.png",
    required: false,
  },
};

export function initClaim(workspace, { force = false } = {}) {
  const path = join(workspace, ".workproof", "claim.json");
  if (existsSync(path) && !force) {
    return { path, created: false };
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(DEFAULT_CLAIM, null, 2)}\n`, "utf8");
  return { path, created: true };
}
