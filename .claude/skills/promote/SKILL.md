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

3. **AI review gate (MANDATORY — a promote without this is invalid)** — review the full accumulated
   diff, not per-commit slices:

   ```bash
   git diff origin/main...HEAD
   ```

   - Run the **security-review** skill in audit mode over that diff (checklist + grep sweeps).
   - Review the diff against **clean-code** (function shape, naming, errors-as-values, dead code)
     and **react-best-practices / next-best-practices** for any UI/route code.
   - Findings: CRITICAL/HIGH → fix on development before opening the PR. MEDIUM/LOW → fix or
     document in the PR body as known debt.
   - This is the one deep review per phase — per-commit reviews don't see integration bugs.

4. **Push** — `git push origin development`.

5. **Open the promote PR**:

   ```bash
   gh pr create --base main --head development \
     --title "Promote development to main: <one-line summary>" \
     --body "<bullet list of what's included since last promote>"
   ```

   If a promote PR is already open, reuse it — never open a duplicate.

6. **Watch CI** — `gh pr checks --watch`. On failure: `gh run view <id> --log-failed`, fix on
   development, push, the PR updates itself, re-watch. Max 3 fix loops, then report and stop.

7. **Merge on green** — `gh pr merge --merge` (merge commit keeps development history intact; no
   squash — granular commits stay bisectable).

8. **Report** — PR URL, merge commit, what shipped.

## Rules

- Never push directly to main. Never force-push either branch.
- PR titles/bodies in English, conventional tone.
- A green PR is the ONLY merge criterion — no "it works on my machine" merges.
