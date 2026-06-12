# Drafty

A fast, simple writing workspace for professionals — rich text documents behind a subscription
paywall. Marketing site → email/password auth → Stripe (test mode) checkout → gated TipTap editor.

> Take-home assignment — Senior Full Stack AI Native Developer @ Leadtech. The short write-up
> answering the three assignment questions is in [WRITEUP.md](WRITEUP.md).

## Demo

| Landing → register                                 | Pay (Stripe test checkout)          | Document workspace              |
| -------------------------------------------------- | ----------------------------------- | ------------------------------- |
| ![Landing and registration](docs/demo/landing.gif) | ![Checkout](docs/demo/checkout.gif) | ![Editor](docs/demo/editor.gif) |

## Quick start

Prerequisites: **Node 22** (see `.nvmrc`) with corepack — `corepack enable` activates the pinned
pnpm version automatically.

```bash
git clone https://github.com/sportiz91/drafty.git && cd drafty
corepack enable
pnpm install
pnpm setup     # creates .env.local with a generated JWT_SECRET + migrates the SQLite DB
pnpm dev       # → http://localhost:3000
```

That already runs the full app minus payments: landing, register/login, and the subscriber paywall.
To pay and unlock the editor, wire Stripe test mode (~5 more minutes):

### Stripe test flow

1. Put your **test** secret key (from <https://dashboard.stripe.com/test/apikeys>) in `.env.local`
   as `STRIPE_SECRET_KEY`.
2. Create a recurring price and copy its id into `STRIPE_PRICE_ID`:

   ```bash
   stripe prices create --currency=eur --unit-amount=900 \
     -d "recurring[interval]=month" -d "product_data[name]=Drafty Pro"
   ```

3. Forward webhooks — the command prints the `whsec_...` signing secret; put it in
   `STRIPE_WEBHOOK_SECRET` and restart the dev server:

   ```bash
   stripe listen --forward-to localhost:3000/api/vendor/stripe/webhooks
   ```

4. Subscribe with test card **4242 4242 4242 4242** (any future expiry, any CVC, any ZIP).

Access is granted by the webhook server-side — the success redirect alone never flips entitlement
(see [WRITEUP.md](WRITEUP.md) for the delayed-webhook story).

## Architecture

```
visitor → / (marketing) → /register → /documents (upgrade card, non-subscriber)
        → Stripe Checkout → verified webhook → subscriber → /documents (TipTap workspace)
```

One Next.js 15 (App Router) application, layered with a strict dependency direction — **route
handler → service → db action → db**:

| Layer      | Path                                 | Responsibility                                         |
| ---------- | ------------------------------------ | ------------------------------------------------------ |
| API routes | `src/app/api/v1/<domain>/`           | Zod validation, auth guards, error→HTTP mapping        |
| Services   | `src/services/`                      | Business logic: entitlement, fulfillment, sanitization |
| DB actions | `src/database/actions/`              | The only layer that touches Drizzle/SQLite             |
| UI         | `src/app/`, `src/features/<domain>/` | Server components + small client islands               |

- **Auth** — JWT access token (15 min) + opaque rotating refresh token (7 days, stored hashed), both
  `httpOnly` cookies. Every protected route re-validates server-side (`requireAuth` /
  `requireSubscriber`); the middleware only does optimistic redirects (UX, not security).
- **Billing** — Stripe hosted Checkout + Customer Portal ("Manage billing"). The signature-verified
  webhook is the **only writer** of subscription state, idempotent by event id and retry-safe
  (fulfillment failure → unmark + non-2xx → Stripe retries).
- **Documents** — TipTap editor with debounced autosave and rename, two-step delete confirm, sidebar
  with last-updated times. Every write is sanitized server-side (HTML allowlist), and ownership is
  enforced in the API: someone else's document id answers **404, same as a nonexistent one** — no
  existence oracle.

## Commands

| Command                    | What                                                 |
| -------------------------- | ---------------------------------------------------- |
| `pnpm dev`                 | Dev server (Turbopack)                               |
| `pnpm build && pnpm start` | Production build + serve (webpack — see limitations) |
| `pnpm test:unit`           | Jest unit suite (54 tests, colocated specs)          |
| `pnpm test:e2e`            | Playwright e2e (starts its own server)               |
| `pnpm code-quality`        | format check + lint + type-check                     |

## Quality pipeline

Three gates, from keystroke to `main`:

1. **Pre-commit (husky)** — secret scan (`scripts/check-secrets.mjs`), lint-staged (eslint +
   prettier on staged files), full `tsc`, and commitlint (conventional commits).
2. **CI on every push** (`.github/workflows/ci.yml`) — lint → format check → type check → Jest unit
   suite (54 tests, colocated `*.spec.ts(x)`) → Playwright e2e against the production build.
3. **Branch model** — all work lands on `development`; promoting to `main` follows
   `.claude/skills/promote/`, which requires green CI **and an adversarial AI review pass** before
   the PR. That review caught real bugs pre-merge (e.g. a backslash open-redirect variant).

The live-checkout e2e (`e2e/billing.spec.ts`) drives the **real** hosted Stripe page and needs local
secrets, so it is explicitly gated: `STRIPE_E2E=1 pnpm exec playwright test e2e/billing.spec.ts`
with `stripe listen` running — CI skips it honestly instead of faking a pass.

## Security decisions

The full reasoning for the headline one is in [WRITEUP.md](WRITEUP.md); the rest, with pointers:

- **Server-side HTML sanitization** on every document write — allowlist, kills stored XSS at the
  trust boundary (`src/services/document.service.ts`, vectors unit-tested).
- **Auth**: short-lived JWT + rotating refresh tokens stored hashed; timing-safe login; HS256 pinned
  (`src/lib/auth/`, `src/services/token.service.ts`).
- **Authorization on the server, twice** — `requireAuth` + `requireSubscriber` on the API,
  re-checked in server components; middleware redirects are UX only (`src/lib/auth/`).
- **No IDOR, no existence oracle** — someone else's document id answers 404, identical to a
  nonexistent one (`src/app/api/v1/documents/[id]/route.ts`).
- **Webhook discipline** — signature verified over the raw body, idempotent by event id, retry-safe
  on fulfillment failure (`src/app/api/vendor/stripe/webhooks/route.ts`).
- **Abuse controls** — per-route rate limits, request body size caps, security headers + CSP
  (`next.config.ts`).

## AI-native workflow (`.claude/`)

The committed `.claude/` directory is part of the submission: it is how AI agents were kept on rails
in this repo. `.claude/skills/` encodes the project's conventions as executable playbooks —
`clean-code` and `react/next-best-practices` (how code must be written), `unit-tests` and
`e2e-tests` (how to test, with hard-won gotchas), `code-quality` (the fix loop), `security-review`
and `promote` (the adversarial review gate before `main`). An agent picking up this repo reads those
first and inherits the standards instead of improvising them. They double as honest documentation of
the engineering decisions for human reviewers.

## Credits (starters and references)

- **Design**: the visual language (pill buttons, card rhythm, tokens) is adapted from the Airy
  Framer template as a reference — rebuilt from scratch as Tailwind utilities, no template code
  imported.
- **Auth & Stripe scaffolding**: ported from my own private starter projects, then reworked for this
  assignment — refresh-token rotation with hashed storage, the idempotent webhook fulfillment, and
  the scoped billing-portal configuration were added or rewritten here.
- **Editor**: TipTap StarterKit, following the official docs patterns.

## Tradeoffs (and what I'd do next with another day)

- **SQLite + better-sqlite3** over Postgres: zero-infra setup for reviewers, plenty for the
  assignment's scale. Drizzle keeps the swap to Postgres mechanical. _Next day:_ do that swap and
  deploy (the repo is CI-ready).
- **Custom JWT auth** over a library (NextAuth/better-auth): deliberate, to make the security
  reasoning visible — rotation, hashed refresh tokens, server-side guards. In a real product I'd
  pick a maintained library and spend the time on the product instead.
- **Autosave (debounced)** over a save button: matches the "fast writing workspace" promise; visible
  save states (`Saving… / Saved / failed`) instead of silent magic.
- **No UI kit**: a handful of hand-rolled atoms on design tokens; fewer moving parts to review.
- **Security and architecture over UI polish**: with a fixed time budget, the depth went into the
  auth/billing/sanitization layers and the quality pipeline above. The visible consequence is an
  intentionally minimal app shell.

**What I'd do next, in order:** turn the paid app into a proper dashboard (top bar, persistent
sidebar with search, command palette feel); UI polish across empty/error states and transitions;
document version history; optimistic sidebar updates; password reset + OAuth; and a
reconcile-on-login fallback that re-fetches subscription state from Stripe if a webhook was missed
entirely.

## Known limitations

- Production build runs **webpack** intentionally — Turbopack currently crashes bundling drizzle +
  better-sqlite3 (TDZ error). Dev uses Turbopack.
- Rate limiting is in-memory (per-instance) and keyed by direct peer IP — fine locally, would need a
  shared store + trusted proxy config behind a load balancer.
- Single plan, no proration/plan changes; cancellations take effect via webhook + period-end guard.
- No email verification (explicitly out of scope per the assignment).
- `COOKIE_SECURE` defaults to false because the assignment runs on http://localhost; set it true on
  any HTTPS deploy.

## Time log

- **Started:** Thursday 2026-06-12, 14:15 CEST (the initial commits mark the start).
- **Finished:** Thursday 2026-06-12, ~19:30 CEST (the last commit marks the finish).
- **Approximate time spent:** ~5 focused hours.

## AI usage (AI-native note)

Built pair-programming with Claude Code. The AI never merged unreviewed: project skills encode the
conventions it must follow, husky and CI gate every commit (secret scan, lint, types, 54 unit and 8
e2e tests), and the promote workflow includes a mandatory adversarial AI review pass — which caught
real bugs before main (e.g. a backslash open-redirect variant in the login redirect). Every flow in
the acceptance checklist was also verified manually in the browser.
