---
name: code-quality
description:
  Run and fix code quality for drafty — lint + type-check in parallel, auto-fix, format LAST, then
  unit tests. Use when the user says "code quality", "fix lint", "run quality", before committing a
  feature, or after any large code change.
---

# Code Quality

Quality enforcement loop for drafty. Order matters: **format runs last**, only after lint and
type-check pass.

## Phase 1 — Parallel checks

Run both in PARALLEL (separate Bash calls, never chained with `&&`):

```bash
pnpm run lint 2>&1; echo "EXIT_CODE:$?"
pnpm run type-check 2>&1; echo "EXIT_CODE:$?"
```

Ignore lint **warnings** — only errors block. Both green → Phase 3.

## Phase 2 — Fix loop (max 3 cycles)

1. `pnpm run lint:fix` — auto-fix what's mechanical.
2. Re-run both checks.
3. Remaining errors: READ each affected file first, then fix manually.
   - ≤3 errors in ≤2 files → fix inline.
   - More → group by file and fix file-by-file.
4. Re-verify. After 3 cycles with remaining errors: STOP and report what's left — do not loop
   forever.

Never fix an error by weakening the config (no rule disabling, no `any`, no `@ts-ignore`) unless the
user explicitly approves.

## Phase 3 — Format

```bash
pnpm run format
```

Always after lint + type-check are green, never before.

## Phase 4 — Unit tests

```bash
pnpm run test:unit 2>&1 | tail -15
```

If tests fail: REPORT and STOP. Never auto-fix failing tests as part of quality — test failures are
real work, not formatting.

## Report

```
## Quality Report
- Status: PASS | FAIL
- Fix cycles: N
- Fixed: [list]
- Remaining: [list or none]
- Unit tests: X passed / Y failed
```
