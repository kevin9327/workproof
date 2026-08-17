# workproof

**After the agent finishes, prove the work actually happened.**

Coding agents write code, run commands, and say they are done.
`workproof` is the one command that checks the claim: tests, diffs, screenshots, and a receipt you can replay.

> Status: public from day one. The verifier is being built in this repo.

## Why this exists

Agents are fast. They are also confident when they are wrong.

- Tests were “green” in the chat, not on disk
- A file was “updated” and the diff is empty
- A UI “works” and nobody opened a browser
- A bug is “fixed” and the failing case was never rerun

`workproof` turns those claims into checks. If it cannot reproduce the result, it fails.

```text
$ workproof
PASS  tests      41 passed
PASS  diff       3 files changed, as claimed
FAIL  screenshot login page still shows the old error
PASS  receipt    sha256: 9f3c… replayable

workproof: 3/4 checks passed
```

## What it will do

| Check | Question it answers |
| --- | --- |
| **tests** | Did the suite the agent cited actually run and pass here? |
| **diff** | Do the files on disk match what the agent said it changed? |
| **screenshot** | Does the UI state the agent described exist? |
| **receipt** | Can a third party replay the same inputs and get the same verdict? |

One CLI. One exit code. One receipt.

## Install

Not published yet. Star and watch this repo — the first runnable cut lands here.

```bash
# coming next
# npx workproof
# brew install workproof
```

## License

MIT
