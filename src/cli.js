import { resolve } from "node:path";
import { runWorkproof } from "./run.js";

export function parseArgs(argv) {
  const out = {
    workspace: null,
    claim: null,
    receipt: null,
    help: false,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--workspace" || arg === "-C") {
      out.workspace = argv[i + 1];
      i += 1;
    } else if (arg === "--claim") {
      out.claim = argv[i + 1];
      i += 1;
    } else if (arg === "--receipt") {
      out.receipt = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("-")) {
      const error = new Error(`unknown flag: ${arg}`);
      error.code = "BADFLAG";
      throw error;
    } else {
      rest.push(arg);
    }
  }
  if (rest[0] && !out.workspace) out.workspace = rest[0];
  return out;
}

export const HELP = `workproof — prove what your coding agent just did

Usage:
  node bin/workproof.js [workspace] [--claim <path>] [--receipt <path>]

Checks:
  tests        run the cited test command in the workspace
  diff         confirm claimed file edits exist on disk
  screenshot   PASS/FAIL/SKIP from a real capture-or-absence rule
  receipt      write a replayable record of inputs and verdicts

Exit codes:
  0  every cited claim reproduced (SKIP is allowed)
  1  a cited claim could not be reproduced
`;

export async function main(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 1;
  }
  if (args.help) {
    stdout.write(HELP);
    return 0;
  }

  const workspace = resolve(args.workspace ?? process.cwd());
  const result = await runWorkproof({
    workspace,
    claimPath: args.claim,
    receiptPath: args.receipt,
  });
  stdout.write(result.output);
  return result.exitCode;
}
