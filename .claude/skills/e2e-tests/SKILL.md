---
name: e2e-tests
description:
  Write and run Playwright end-to-end tests for drafty — data-id selectors, per-test users, no
  arbitrary timeouts. Use when the user asks for e2e tests, integration tests, browser tests, or to
  verify a full user flow (landing → register → pay → editor).
---

# E2E Tests

Playwright (chromium) in `e2e/`. Config: `playwright.config.ts` — the dev/prod server starts
automatically via `webServer`; locally it reuses a running `pnpm run dev`.

## Run

```bash
pnpm run test:e2e               # all
pnpm exec playwright test e2e/auth.spec.ts   # one file
pnpm exec playwright show-report             # after failures
```

## Conventions

- **Selectors**: `data-id` attributes only (`testIdAttribute` is configured) →
  `page.getByTestId('login-submit')`. Never CSS classes, never text that marketing may rewrite. When
  writing app code for a flow that will be e2e-tested, add `data-id` attributes as you go.
- **One user per test**: generate unique credentials (`e2e+<test>-<Date.now()>@drafty.test`) so
  tests parallelize safely against the same DB.
- **Wait on state, not time**: `expect(locator).toBeVisible()`, `page.waitForResponse()` — never
  `waitForTimeout`.
- **Critical flows** (these must always have coverage):
  1. Landing renders value prop + pricing
  2. Register → login → logout
  3. Non-subscriber is blocked from the editor and sees the upgrade path
  4. Stripe test checkout → webhook → editor unlocked
  5. Document create / edit / autosave / rename / delete, persisting across re-login
- **Stripe in e2e**: drive Checkout with test card `4242 4242 4242 4242` for the happy path; for
  fulfillment edge cases, trigger webhook events with the Stripe CLI
  (`stripe trigger checkout.session.completed`) instead of clicking through the UI — webhook
  signature verification itself is unit-tested, not e2e-tested.
- **DB state**: tests run against the local SQLite file; each test creates what it needs and never
  assumes seeds.

## Gotchas (hard-won)

- **Cold dev-server compiles**: locally the suite runs against `pnpm dev`, which compiles routes on
  demand — the first navigation after a cold start can take >5s. `expect.timeout` is set to 10s in
  `playwright.config.ts`; don't "fix" slow first assertions by adding waits.
- **Rate limits**: the webServer config sets `RATE_LIMIT_DISABLED=true` (the suite fires many auth
  requests from one IP). Rate limiting itself is unit-tested — never disable it anywhere else.
- **Standalone debug scripts** (`node script.mjs` with chromium) do NOT read `playwright.config.ts`,
  so `getByTestId` falls back to `data-testid`. Use raw `page.locator('[data-id="..."]')` selectors
  in throwaway scripts.

## CI

The `e2e-tests` job runs last in the pipeline (after lint/format/type/unit), against the production
build. Failures upload the HTML report as an artifact — fetch it with
`gh run download <run-id> -n playwright-report`.
