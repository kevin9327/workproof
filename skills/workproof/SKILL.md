---
name: workproof
description: After finishing a coding task, write a workproof claim and verify tests, diffs, screenshots, and a receipt. Use when the user asks to prove, verify, or receipt agent work, or after claiming a bug is fixed.
---

# workproof

Do not say the work is done until `workproof` exits 0.

## After you change files

1. Write `.workproof/claim.json` for the workspace you edited:

```json
{
  "tests": {
    "command": ["node", "--test"],
    "expect": "pass"
  },
  "diff": {
    "files": [{ "path": "src/the-file-you-changed.js", "op": "modify" }]
  },
  "screenshot": {
    "path": "shots/app.png",
    "required": false
  }
}
```

2. Run the real binary, not a paraphrase:

```bash
node bin/workproof.js
```

Or, from another repo that has workproof installed:

```bash
npx --yes github:kevin9327/workproof
```

3. If exit code is 1, the claim was not reproduced. Fix the work or the claim, then run again.

## Rules

- Cite only files you actually changed. A claimed path that is not on disk is FAIL.
- Cite a test command that can run here. If the runner cannot start, that is FAIL.
- Do not invent a screenshot. Missing + `required: false` is SKIP. Missing + required is FAIL.
- Prefer `--json` when a parent agent needs the verdict as data.
