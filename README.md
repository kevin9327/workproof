# workproof

**After the agent finishes, prove the work actually happened.**

Coding agents write code, run commands, and say they are done.
`workproof` is the one command that checks the claim: tests, diffs, screenshots, and a receipt you can replay.

If a cited claim cannot be reproduced, the process exits non-zero.

> Status: v0.1 — first usable, fail-closed verifier. Node 18+, no install beyond cloning this repo.

## 30-second demo

An agent claimed it edited `src/fixed.js`. The file is not on disk.

```bash
git clone https://github.com/kevin9327/workproof
cd workproof
node bin/workproof.js --workspace examples/caught
```

```text
PASS tests      1 passed
FAIL diff       claimed edit not on disk: src/fixed.js
SKIP screenshot no capture at shots/login.png
PASS receipt    wrote .workproof/receipt.json

workproof: 2/4 checks passed
workproof: FAIL — a cited claim could not be reproduced
```

A workspace whose claims are true:

```bash
node bin/workproof.js --workspace examples/clean
```

```text
PASS tests      1 passed
PASS diff       1 file matches claim
PASS screenshot png capture at shots/login.png
PASS receipt    wrote .workproof/receipt.json

workproof: 4/4 checks passed
```

## What each check answers

| Check | Question it answers |
| --- | --- |
| **tests** | Did the suite the agent cited actually run here, with the claimed result? If the runner cannot be invoked, this is FAIL. |
| **diff** | Do the files the agent said it changed exist on disk (and match optional `contains` / differ from `before`)? |
| **screenshot** | Is there a real image capture? Missing + required → FAIL. Missing + `required: false` → SKIP. |
| **receipt** | Was a replayable JSON record of the inputs and verdicts written and re-read? |

## Claim file

Put the agent's claims in `.workproof/claim.json` (or pass `--claim`):

```json
{
  "tests": {
    "command": ["node", "--test", "demo.test.js"],
    "expect": "pass"
  },
  "diff": {
    "files": [
      { "path": "src/app.js", "op": "modify", "contains": "export function greet" }
    ]
  },
  "screenshot": {
    "path": "shots/login.png",
    "required": false
  }
}
```

## Run

```bash
node bin/workproof.js [workspace] [--claim <path>] [--receipt <path>]
```

| Exit | Meaning |
| --- | --- |
| 0 | Every cited claim reproduced (SKIP is allowed) |
| 1 | A cited claim could not be reproduced |

`npm test` runs the same check functions the CLI uses.

## License

MIT
