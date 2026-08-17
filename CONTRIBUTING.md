# Contributing

## Checks

The four named checks live in `src/checks/`. Keep them pure over `workspace + claim` so `test/checks.test.js` can feed fixtures without starting the whole product.

Process spawn (test runner) stays in `src/spawn.js`.

## Verify

```bash
node --test test/*.test.js
node bin/workproof.js --workspace examples/caught
```

The caught example must exit 1. The clean example must exit 0.

If you change CLI text, update the README sample so it still matches a real run. `test/cli.test.js` locks that.
