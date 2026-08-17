import { resolve } from "node:path";
import { formatJson, formatReport } from "./format.js";
import { initClaim } from "./init.js";
import { runWorkproof } from "./run.js";

export function parseArgs(argv) {
  const out = {
    command: "run",
    workspace: null,
    claim: null,
    receipt: null,
    help: false,
    version: false,
    json: false,
    color: null,
    force: false,
  };
  const rest = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "-V" || arg === "--version") {
      out.version = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--color") {
      out.color = true;
    } else if (arg === "--no-color") {
      out.color = false;
    } else if (arg === "--force") {
      out.force = true;
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
  if (rest[0] === "init" || rest[0] === "run") {
    out.command = rest.shift();
  }
  if (rest[0] && !out.workspace) out.workspace = rest[0];
  return out;
}

export const HELP = `workproof — prove what your coding agent just did

Usage:
  node bin/workproof.js [workspace] [--claim <path>] [--receipt <path>]
  node bin/workproof.js init [workspace]
  node bin/workproof.js --json [workspace]

Checks:
  tests        run the cited test command in the workspace
  diff         confirm claimed file edits exist on disk
  screenshot   PASS/FAIL/SKIP from a real capture-or-absence rule
  receipt      write a replayable record of inputs and verdicts

Exit codes:
  0  every cited claim reproduced (SKIP is allowed)
  1  a cited claim could not be reproduced
`;

function wantColor(args, stdout) {
  if (args.color === true) return true;
  if (args.color === false) return false;
  if (args.json) return false;
  if (process.env.NO_COLOR) return false;
  return Boolean(stdout.isTTY);
}

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
  if (args.version) {
    stdout.write("0.1.0\n");
    return 0;
  }

  const workspace = resolve(args.workspace ?? process.cwd());

  if (args.command === "init") {
    const result = initClaim(workspace, { force: args.force });
    stdout.write(
      result.created
        ? `wrote ${result.path}\n`
        : `already exists ${result.path} (use --force to overwrite)\n`,
    );
    return 0;
  }

  const result = await runWorkproof({
    workspace,
    claimPath: args.claim,
    receiptPath: args.receipt,
  });
  if (args.json) {
    stdout.write(formatJson(result));
  } else {
    stdout.write(
      formatReport({
        checks: result.checks,
        overall: result.overall,
        color: wantColor(args, stdout),
      }),
    );
  }
  return result.exitCode;
}
