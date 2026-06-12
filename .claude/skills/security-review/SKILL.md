---
name: security-review
description:
  Security review for drafty's API routes, auth code, and webhooks. Use this skill AUTOMATICALLY
  whenever you create or modify any route handler under src/app/api/, touch auth/cookie/token code,
  write the Stripe webhook, or before a promote PR to main — even if the user doesn't mention
  security. Also use when the user says "security review", "audit", or asks if something is safe.
---

# Security Review

Drafty is a paywalled SaaS: auth + payments + user documents. A missed check here is not theoretical
— the take-home rubric explicitly scores "Security & correctness (20%): auth, webhook verification,
server-side authorization".

## Three-layer model for every non-public endpoint

```
Layer 1: Authentication → requireAuth(request) — is the JWT valid?
Layer 2: Entitlement    → is the user an active subscriber? (DB check, for document routes)
Layer 3: Ownership      → does THIS user own THIS resource? (WHERE userId = auth.userId)
```

Skipping layer 3 is the classic bug: auth without ownership means any logged-in user can read or
delete anyone's documents by guessing IDs. Ownership lives in the QUERY (`and(eq(id), eq(userId))`),
never in an if-check after fetching — that pattern leaks existence via 404-vs-403 timing and is easy
to forget on new routes.

## Checklist per route

- [ ] `requireAuth` called and its `NextResponse` early-returned (public routes: register, login,
      refresh, webhook — nothing else).
- [ ] Subscriber gate on document mutation routes (server-side DB read, never a client flag).
- [ ] Ownership constraint inside the Drizzle query for any `[id]` route.
- [ ] Input parsed with the Zod validator BEFORE any service call; no `request.json()` fields used
      directly.
- [ ] Errors: generic messages out (`Invalid credentials`, not `User not found`); no stack traces or
      Drizzle errors in responses; details only in server logs.
- [ ] No secrets in code — config comes from `src/lib/config/config.ts`; new env vars go in
      `.env.example` with an empty value.
- [ ] Cookies: httpOnly + sameSite=lax always; Secure governed by `COOKIE_SECURE`.
- [ ] Stripe webhook: signature verified with `constructEvent(await request.text(), sig, secret)`
      BEFORE reading any event field; raw body, never `request.json()` first; idempotent fulfillment
      (an event delivered twice must not double-grant).

## Auth-specific rules (this repo's design)

- Access JWT 15m / refresh token opaque + rotated on every use; rotation = delete-then-issue, so a
  replayed refresh token must fail with 401 (covered by unit test — keep it green).
- `bcrypt` rounds stay at 12; password max length 72 (bcrypt truncation).
- Login and register must return identical timing/shape for unknown-email vs wrong-password as far
  as practical, and always the same error string.
- Middleware is UX-only. Any real decision (who is it, can they touch this) happens in the route via
  `requireAuth` + query constraints.

## How to run a review

1. Scope: `git diff --name-only HEAD` (default) or the paths the user gives you.
2. Read each route/service in scope and walk the checklist above.
3. Grep sweeps that catch regressions fast:
   - `grep -rn "request.json()" src/app/api` → every hit must be wrapped by a Zod parse.
   - `grep -rn "db\." src/app/api` → routes must not touch Drizzle directly (layer violation).
   - `grep -rLn "requireAuth" src/app/api/v1 --include=route.ts` → unauthenticated routes; each must
     be on the public list.
4. Report findings as: file:line, severity (BLOCKER/WARN), what an attacker could do, the fix. No
   findings → say so explicitly and list what was checked.

Deterministic secret scanning is NOT this skill's job — `scripts/check-secrets.mjs` runs in the
husky pre-commit hook on every commit. This skill covers what regex can't: logic, authorization, and
design.
