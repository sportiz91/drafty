#!/usr/bin/env bash
# WorktreeCreate hook — replaces Claude Code's default worktree creation so
# every Claude-created worktree follows this repo's conventions automatically:
#   - base ref: origin/development (the harness default would use origin/main)
#   - copies the gitignored files listed in .worktreeinclude (.env.local,
#     the local secret-scan patterns) into the new worktree
#   - installs dependencies (pnpm store is shared — ~seconds, mostly hardlinks)
# Worktrees are created as siblings: <repo-parent>/drafty-<name>.
# stdout must be ONLY the worktree path; all progress goes to stderr.
set -euo pipefail

# Non-interactive shells resolve an old Node; pin 22 for pnpm.
export PATH="$HOME/.nvm/versions/node/v22.22.1/bin:$PATH"

ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
PARENT="$(dirname "$ROOT")"

INPUT=$(cat)
NAME=$(echo "$INPUT" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{let j={};try{j=JSON.parse(d)}catch{};console.log(String(j.name||"wt").replace(/[^a-zA-Z0-9._-]/g,"-"))})')
DIR="$PARENT/drafty-$NAME"
BRANCH="feature/$NAME"

git -C "$ROOT" fetch origin development >&2 || echo "fetch failed - using local ref" >&2
if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  BRANCH="$BRANCH-$(git -C "$ROOT" rev-parse --short origin/development)"
fi
git -C "$ROOT" worktree add "$DIR" -b "$BRANCH" origin/development >&2

if [ -f "$ROOT/.worktreeinclude" ]; then
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    case "$p" in \#*) continue ;; esac
    if [ -f "$ROOT/$p" ]; then
      mkdir -p "$DIR/$(dirname "$p")"
      cp "$ROOT/$p" "$DIR/$p"
      echo "copied $p" >&2
    fi
  done < "$ROOT/.worktreeinclude"
fi

(cd "$DIR" && pnpm install --frozen-lockfile >&2) ||
  echo "WARNING: pnpm install failed - run it manually in the worktree" >&2

echo "$DIR"
