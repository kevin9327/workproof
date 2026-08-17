# AGENTS

`workproof` is fail-closed. A chat transcript is not evidence.

After you edit this repo or any workspace you are verifying:

1. Update `.workproof/claim.json` so it names the test command and the files you changed.
2. Run `node bin/workproof.js` (add `--workspace <dir>` when the claim is not in cwd).
3. Treat a non-zero exit as an incomplete task.

`npm test` exercises the same check functions the CLI uses.
