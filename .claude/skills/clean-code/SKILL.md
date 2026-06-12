---
name: clean-code
description:
  Function- and module-level code craftsmanship rules for drafty — naming, function shape, control
  flow, TypeScript usage, comments, error handling, and the pre-commit self-review. Apply when
  WRITING or REFACTORING any TypeScript code in this repo (components, server actions, lib, tests).
  Complements react-best-practices (architecture/React patterns) and code-quality (the lint/
  type-check/format loop) — this skill is about how each function and file reads.
---

# Clean Code

Why this exists: the take-home rubric scores **Code quality at 25%** — "readable structure, sensible
separation, TypeScript usage" — and explicitly looks for "evidence that you reviewed AI-generated
code rather than pasted it blindly". These rules are that evidence, applied consistently.

Distilled from Santiago's refactor doctrine (`~/.claude/commands/refactor/`),
labs42io/clean-code-typescript, and this repo's existing conventions. When this skill and
`react-best-practices` overlap, react-best-practices wins for React/architecture questions.

## Functions

- **One thing, one abstraction level.** A function either orchestrates (calls named steps) or does
  work (implements one step). Mixing both is the smell that triggers extraction.
- **Worker functions stay under ~30 lines; orchestrators under ~50-60.** Extract cohesive, complex
  blocks into well-named helpers. But —
- **Inline the trivial.** A helper used once, not exported, 1-5 lines of obvious logic → inline it
  at the call site. Same for single-use module constants. Concrete beats abstract; jumping to a
  3-line function to understand a value costs more than reading it in place. Extract only what is
  reused, genuinely complex, or significantly clarified by a name.
- **No `else`.** Guard clauses and early returns only. `if-else-if` chains become a sequence of
  early returns or a lookup map.
- **≤ 2-3 parameters.** Beyond that, a single typed options object. Never boolean flags as
  parameters — a flag means the function does two things; split it.
- **No hidden side effects.** A function named `get*`/`compute*`/`format*` must not mutate or write.
  Mutating functions say so (`save*`, `update*`, `delete*`).

## Naming

- Searchable and pronounceable; no abbreviations that need mental mapping (`docList`, not `dl`).
- One word per concept across the codebase: pick `document` and never alternate with `doc`/
  `file`/`note` for the same entity. Same for `subscriber` vs `subscribed` vs `isPro`.
- No redundant context: in `document-card.tsx`, the prop is `title`, not `documentCardTitle`.
- Functions are verbs (`createDocument`), booleans are `is*/has*/can*`, handlers are `handle*` (per
  react-best-practices), pure render helpers are `render*`.
- Magic numbers/strings get a name only when non-obvious or reused —
  `const ACCESS_TOKEN_TTL_SECONDS = 15 * 60` yes; `slice(0, 1)` needs no `FIRST_ELEMENT_COUNT`.
- No type or noise words in names: `typeString`, `dataAsync`, `userObject` — the type system and
  `await` already say it.
- Name length scales with scope: `i` is fine in a 3-line loop or a one-line lambda; a
  widely-imported public helper gets a short intuitive name (`findInactive`); a single-caller
  internal helper gets the long descriptive one (`retrieveUserWithCache`).

## Control flow

- Encapsulate compound conditionals in a named predicate: `if (isActiveSubscriber(user))`, not
  `if (user.subscriptionStatus === 'active' && user.currentPeriodEnd > now)`.
- Prefer positive conditionals: `if (isSubscribed)` over `if (!isNotSubscribed)`.
- Comparisons read left-to-right: `value === null`, never Yoda (`null === value`); don't negate a
  comparison — `!(a === b)` is `a !== b`, `!(count > 0)` is `count <= 0`.
- Truthy checks for booleans and nullable objects (`if (!user)`, not `if (user === null)`); compare
  explicitly only when `0` or `''` are valid values.
- Compute derived values in explanatory intermediate variables instead of one dense expression.

## TypeScript

- **`any` is banned** (lint enforces it). Unknown input → `unknown`, then narrow with a type guard
  or Zod parse. No `as` casts to silence errors — fix the type. No `!` non-null assertions — handle
  the null path or throw with a message.
- **Explicit types at boundaries**: exported functions get explicit parameter and return types; API
  payloads and DB rows get named types. Locals may rely on inference when the right-hand side makes
  the type obvious.
- Parse, don't validate: external data (request bodies, webhook payloads, env vars) crosses the
  boundary through a Zod schema exactly once; everything past it is typed and trusted.
- Discriminated unions for multi-state values
  (`{ status: 'ok', data } | { status: 'error', message }`) — never parallel optionals that can
  desync.
- Derive, don't hand-write: `ReturnType<typeof useX>`, `z.infer<typeof schema>`,
  `Awaited<ReturnType<typeof fn>>` — a hand-maintained copy of an inferable type will desync.
- Shared domain types are single-sourced and imported (`SubscriptionStatus` is declared once) —
  never re-declare the same union inline in two files.

## Comments

- Code self-documents through naming and structure; a comment explaining _what_ means the code
  failed — refactor instead.
- Comments are for **non-obvious constraints and why**: "jose not jsonwebtoken — Edge runtime has no
  Node crypto" is a good comment (the rubric explicitly rewards exactly this). "// fetch the user"
  is noise.
- Never: commented-out code (delete it, git remembers), journal comments, TODO without an
  owner-intention ("TODO(scope): why").

## Errors

- Expected failures (validation, auth, not-found, payment declined) are **typed return values**
  (`{ success: false, error }`), not thrown — thrown exceptions are for bugs and unexpected states.
  (Matches the server-action pattern in react-best-practices.)
- Never swallow: every `catch` either handles meaningfully, rethrows with context, or logs with
  enough detail to debug. Empty catch blocks are bugs.
- User-facing error messages are mapped at the UI edge; internal errors never leak to the client (no
  stack traces or DB messages in API responses).

## Module shape

- Top-to-bottom readability: a file reads like an article — exported/main thing first, then
  subcomponents/helpers, types last (file order per react-best-practices).
- Dead code is deleted, not commented or kept "just in case". Unused exports, props, and branches
  go.
- Duplication: tolerate it twice, extract on the third occurrence — and only into the nearest shared
  scope. "Duplication is far cheaper than the wrong abstraction."
- **No catch-all files or folders**: `utils.ts`, `helpers.ts`, `misc/` are banned — group helpers by
  concern (`storage.ts`, `subscription.ts`, `dates.ts`). Catch-alls are where unrelated functions
  accumulate and cohesion dies.
- A module drifting past ~300 lines is a split-by-concern signal.

## Pre-commit self-review (the AI-native signal)

Before committing, read the full diff (`git diff --staged`) and check:

1. Does every function name still tell the truth about what it does?
2. Any leftover scaffolding — `console.log`, debug routes, commented experiments, unused imports?
3. Could a reviewer follow each file top-to-bottom without jumping?
4. Is every non-obvious decision either self-evident or commented with its constraint?
5. Anything here you couldn't explain if asked in the interview? Rework it until you can.
