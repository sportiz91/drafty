---
name: promote
description:
  Promote development to main via PR — push, open PR, watch CI checks, merge on green. Use when the
  user says "promote", "promote to main", "ship to main", or wants the current development state to
  become official.
---

# Promote development → main

`main` is the official branch. It only moves via promote PRs from `development`, gated by the full
CI pipeline (lint, format, type-check, unit, e2e).

## Steps

1. **Preflight** — refuse to start if any of these fail:

   ```bash
   git rev-parse --abbrev-ref HEAD   # must be development
   git status --porcelain            # must be empty
   git fetch origin && git log origin/development..HEAD --oneline  # unpushed commits?
   ```

2. **Local gate (fast)** — `pnpm run code-quality && pnpm run test:unit`. Red → stop, fix first (use
   the code-quality skill).

3. **Push** — `git push origin development`.

4. **Open the promote PR**:

   ```bash
   gh pr create --base main --head development \
     --title "Promote development to main: <one-line summary>" \
     --body "<bullet list of what's included since last promote>"
   ```

   If a promote PR is already open, reuse it — never open a duplicate.

5. **Watch CI** — `gh pr checks --watch`. On failure: `gh run view <id> --log-failed`, fix on
   development, push, the PR updates itself, re-watch. Max 3 fix loops, then report and stop.

6. **Merge on green** — `gh pr merge --merge` (merge commit keeps development history intact; no
   squash — granular commits stay bisectable).

7. **Report** — PR URL, merge commit, what shipped.

## Rules

- Never push directly to main. Never force-push either branch.
- PR titles/bodies in English, conventional tone.
- A green PR is the ONLY merge criterion — no "it works on my machine" merges.
