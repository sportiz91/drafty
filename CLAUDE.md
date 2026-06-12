# Drafty — Project Guide

Paywalled rich-text-editor SaaS (take-home assignment): marketing landing → email/password auth →
Stripe test-mode subscription → gated TipTap document workspace.

## Commands

Requires **Node 22** (`.nvmrc`) and **pnpm 10** (`packageManager` pin, via corepack).

| Command                 | What                                                  |
| ----------------------- | ----------------------------------------------------- |
| `pnpm dev`              | Dev server (Turbopack)                                |
| `pnpm build`            | Production build (**webpack on purpose** — see below) |
| `pnpm code-quality`     | format:check + lint + type-check                      |
| `pnpm code-quality:fix` | lint:fix → type-check → format (format LAST)          |
| `pnpm test:unit`        | Jest (colocated `*.spec.ts(x)`)                       |
| `pnpm test:e2e`         | Playwright (`e2e/`, starts its own server)            |
| `pnpm db:generate`      | Drizzle migration from schema changes                 |
| `pnpm db:migrate`       | Apply migrations (creates `./data/`)                  |

Setup: `cp .env.example .env.local` (generate `JWT_SECRET` with `openssl rand -hex 32`) →
`pnpm install` → `pnpm db:migrate` → `pnpm dev`.

## Architecture

Layered, strict direction: **route handler → service → db action → db**. Routes only validate
(Zod) + map errors to HTTP; services hold business logic; actions are the only layer touching
Drizzle.

| Layer      | Path                                           |
| ---------- | ---------------------------------------------- |
| API routes | `src/app/api/v1/<domain>/`                     |
| Services   | `src/services/<domain>.service.ts`             |
| DB actions | `src/database/actions/<entity>-actions.ts`     |
| Schemas    | `src/database/schema/<entity>-schema.ts`       |
| Validators | `src/validators/<domain>.validators.ts`        |
| Auth lib   | `src/lib/auth/` (guards, cookies, edge JWT)    |
| Config     | `src/lib/config/config.ts` (Zod-validated env) |

Auth: JWT access (15m) + opaque rotating refresh token (7d, DB-backed), both httpOnly cookies.
Protected API routes call `requireAuth(request)`; middleware only does optimistic UX redirects.

## Conventions

- Conventional commits, English, enforced by commitlint. Branches: `development` (work) → promote PR
  → `main` (official). Never push to main directly.
- Everything in the repo is written in English.
- Unit specs colocated (`foo.ts` → `foo.spec.ts`); e2e selectors use `data-id` attributes only.
- See `.claude/skills/` for workflows (code-quality, promote, unit-tests, e2e-tests) and coding
  rules (react-best-practices, next-best-practices).

## Gotchas (hard-won — do not rediscover)

- **Prod build must be webpack** (`next build`, no `--turbopack`): Turbopack builds break with a TDZ
  error when bundling drizzle + better-sqlite3. Dev Turbopack is fine.
- `better-sqlite3` is native: kept in `serverExternalPackages` (next.config) and
  `pnpm.onlyBuiltDependencies` (package.json). If it fails to load: `pnpm rebuild better-sqlite3`.
- `COOKIE_SECURE` defaults to false because the app runs on http://localhost — `pnpm start` is
  production-mode and Secure cookies would silently break non-browser clients (curl).
- Jest: `clearMocks: true` and `moduleNameMapper` for `@/` are required; env vars live in
  `jest.env.ts` (setupFiles) because config.ts validates env at import time.
