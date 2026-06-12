---
name: parallel-worktree
description:
  Set up, operate and tear down an isolated git worktree of drafty so a second line of work (another
  agent/session) can proceed without touching the main checkout. Use whenever the user asks to work
  "in a worktree", wants parallel work on independent areas (e.g. landing vs editor), mentions
  another agent working on changes, or asks why something fails inside a worktree (missing
  node_modules, missing .env.local, port conflicts).
---

# Parallel Worktree Runner

Two lines of work never share a working tree. Worktrees live under `~/drafty-<name>` with a branch
per worktree.

## Scope by area, not by task

Parallelize only across independent areas (marketing pages vs editor vs API). Two tasks touching the
same module belong in ONE worktree, sequentially — same-file parallel work is how merge conflicts
are born. Shared hotspots to check before splitting: `package.json` (deps), `globals.css` (tokens),
`src/app/page.tsx`, DB schema/migrations. If both tasks need any of them, decide ownership up front
(one side adds deps, the other adds none).

## Create

```bash
git -C ~/drafty fetch origin development
git -C ~/drafty worktree add ~/drafty-<name> -b feature/<name> origin/development
cp ~/drafty/.env.local ~/drafty-<name>/.env.local   # gitignored — not in the checkout
cd ~/drafty-<name> && pnpm install
```

- Branch from `origin/development` — that's where feature work lands; never from main.
- **Disk math (C: is tight on this machine):** `pnpm install` hard-links from the shared store — a
  worktree's node_modules costs directory structure only (~tens of MB), not content. What DOES cost
  real disk is `next build` (`.next/` ≈ 300MB) — worktrees run lint/type-check/unit only; the final
  build runs once in the main checkout after merge.
- Node version gotcha: non-interactive shells resolve Node 18 — every command needs
  `export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"` first.

## What a worktree shares vs isolates

| Shared (one per machine)                 | Isolated (per worktree) |
| ---------------------------------------- | ----------------------- |
| git object store, branches, remotes      | working tree, index     |
| pnpm store (hardlinks)                   | node_modules structure  |
| port 3000, the SQLite file is per-tree\* | `.env.local` (copy it)  |
| Playwright browsers (~/.cache)           | `.next/`, `data/`       |

\* `DATABASE_PATH` is relative (`./data/drafty.db`), so each worktree gets its own empty DB — run
`pnpm db:migrate` if the work needs one. Only one `next dev`/`start` can own port 3000: stop the
main tree's server before running the app from a worktree.

## Quality gates inside the worktree

`pnpm code-quality` and `pnpm test:unit` work immediately after install. Husky hooks come with the
checkout (tracked) and run on every commit — same gates as the main tree, including the secret scan.
Note: `scripts/check-secrets.local.json` is gitignored — copy it too if the worktree will commit
(otherwise the forbidden-names patterns silently don't run):

```bash
cp ~/drafty/scripts/check-secrets.local.json ~/drafty-<name>/scripts/
```

## Deliver

Commit granular conventional commits on the feature branch. Then either:

- **Local merge** (default for short-lived parallel work): from the main tree,
  `git merge feature/<name>` into `development` after reviewing the diff, or
- **Push + PR** to development if the work should run CI before integrating.

Never push to main; the promote skill owns that.

## Cleanup (do it — worktrees left behind eat disk)

```bash
git -C ~/drafty worktree remove ~/drafty-<name>   # refuses if dirty — investigate, don't force
git -C ~/drafty branch -d feature/<name>          # only once merged
```

Removing the worktree also deletes its copied secrets and its `node_modules`/`data` — that's the
point.
