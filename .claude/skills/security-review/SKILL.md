---
name: security-review
description:
  Security standards + audit for drafty — auth, authorization, input/DoS limits, ReDoS, rich-text
  XSS, Stripe webhooks, headers. Use this skill AUTOMATICALLY whenever you create or modify any
  route handler under src/app/api/, touch auth/cookie/token/middleware code, write Zod validators or
  regexes over user input, handle TipTap content, write the Stripe webhook, or before a promote PR
  to main — even if the user doesn't mention security. Also when the user says "security review",
  "audit", "is this safe", or asks about rate limiting, XSS, or payload limits.
---

# Security Review

Drafty is a paywalled SaaS: credentials + payments + user documents, in a PUBLIC repo graded on
"Security & correctness (20%)". This skill has two modes: **standards** (apply while writing code)
and **audit** (run the process at the bottom over a diff or the full API surface).

## Three-layer model — every non-public endpoint

```
Layer 1: Authentication → requireAuth(request) — valid JWT? FIRST line of the handler.
Layer 2: Entitlement    → active subscriber? DB check (never the JWT — it can outlive the
                          subscription by up to 15m; never a client flag)
Layer 3: Ownership      → WHERE userId = auth.userId INSIDE the Drizzle query
```

Public allowlist (everything else MUST have auth): `auth/register`, `auth/login`, `auth/refresh`
(cookie-gated), `auth/logout`, `vendor/stripe/webhooks` (signature-gated).

## Per-route checklist

- [ ] Auth first: `requireAuth` before parsing anything; early-return its `NextResponse`.
- [ ] **Anti-impersonation**: identity comes from `auth.userId` ONLY. Never read `userId`,
      `authorId`, or any identity field from body/query for authorization:

  ```ts
  // BAD  — client chooses whose document this is
  await docService.create({ userId: body.userId, ... });
  // GOOD — JWT decides
  await docService.create({ userId: auth.userId, ... });
  ```

- [ ] Ownership in the query (`and(eq(docs.id, id), eq(docs.userId, auth.userId))`), not as an
      if-check after fetching. Return **404 for both not-found and not-owned** — same status, same
      shape — so attackers can't probe which IDs exist (existence oracle). SQLite IDs are
      enumerable; ownership-in-query is the real IDOR defense.
- [ ] **Mass assignment**: Zod-parse the body and pass ONLY validated fields to services. Never
      spread `...body` into an insert/update. Clients must not be able to set `isSubscriber`,
      `stripeCustomerId`, timestamps, or ids.
- [ ] Body read via `readJsonBody(request, cap)` (never bare `request.json()` — App Router has NO
      built-in body limit self-hosted; see DoS section). Map `PayloadTooLargeError` → 413,
      `SyntaxError` → 400, `ZodError` → 400 with `error.issues`.
- [ ] Path/query params validated before hitting the service (id format, pagination `limit` clamped
      to a max, e.g. ≤100).
- [ ] **Empty-array bypass** (Drizzle): `inArray(col, [])` can return ALL rows. Early-return an
      empty result before building the query when an id list is empty.
- [ ] Rate limit on auth + write endpoints via `enforceRateLimit` (login 5/min/IP, register
      3/min/IP, refresh 10/min/IP; writes looser).
- [ ] Errors out are generic (`Invalid credentials`, `Operation failed`); stack traces and
      Drizzle/SQLite errors only ever reach `console.error`, never the response.
- [ ] No secrets in code — all config through `src/lib/config/config.ts`; new env vars land in
      `.env.example` with empty values.

## Auth & session rules (this repo's implemented design — keep these true)

- Login runs **exactly one bcrypt compare on every path** (unknown email → compare against
  `DUMMY_PASSWORD_HASH`). Same error string, status, and shape for unknown-email and wrong-password
  — no enumeration via timing or text. Register's 409 is accepted as a deliberate, documented
  exception (rate-limited).
- JWT: HS256 **pinned** in both verifiers (`jsonwebtoken` and `jose`); secret ≥32 bytes from env;
  15m expiry; `verify()` never `decode()`. No entitlement claims in the token.
- Refresh tokens: 256-bit random, stored **SHA-256 hashed** (a leaked DB can't be replayed), rotated
  on every use (delete-then-issue — replay of a rotated token must 401; unit-tested), revoked on
  logout.
- Cookies: `httpOnly` + `sameSite=lax` always; `Secure` via `COOKIE_SECURE`. SameSite=Lax is the
  CSRF defense for the cookie-authenticated POST endpoints (cross-site POSTs don't carry the
  cookies) — don't weaken it to `none`.
- bcrypt rounds 12; password max 72 (bcrypt truncates beyond 72 bytes).
- Middleware is UX-only (CVE-2025-29927 made this canon: middleware auth is bypassable). Every real
  decision happens in the handler.
- **Open redirect**: the `?redirect=` param on login must only ever be followed if it's a relative
  path (`startsWith('/') && !startsWith('//')`). Never redirect to user-supplied absolute URLs.

## DoS & input hardening

- **Body size**: App Router route handlers have NO default body limit when self-hosted
  (`next start`); Server Actions' 1MB limit does NOT apply to route handlers. Always `readJsonBody`
  — Content-Length precheck + hard stream cap. Caps: 64KB default JSON; ~1MB for the document
  autosave endpoint (and a matching Zod `.max()` on the content field so the DB layer is
  independently protected).
- **ReDoS** — Node is single-threaded; one catastrophic regex = whole API down:
  - Never write nested/overlapping quantifiers over user input: `(a+)+`, `(\w+\s?)*`.
  - Zod's own email regex had exactly this bug (CVE-2023-4316, zod ≤3.22) — we're on zod 4; never
    downgrade. Prefer `z.email()`/built-ins over hand-rolled `.regex()`.
  - `.regex()` runs verbatim — Zod adds no protection. Custom patterns must be anchored and linear;
    always `.max()` the string BEFORE regexing (length cap is the cheapest mitigation).
- Pagination `limit` clamped server-side; list queries always scoped by `userId` (make it a required
  service-function parameter so it can't be forgotten).
- SQLite is single-writer: keep transactions short; WAL + `busy_timeout` mitigate contention. The
  `.db`/`-wal`/`-shm` files live in `/data` (gitignored) — NEVER under `public/`.

## Rich-text XSS (TipTap) — the #1 drafty-specific risk

TipTap does NOT sanitize (maintainers' own words; there's a Snyk advisory for stored XSS). Schema
enforcement is not a security control.

- Sanitize **server-side on write** with `sanitize-html`: allowlist exactly what our extensions emit
  (`p, h1-h3, strong, em, u, s, ul, ol, li, a, blockquote, code, pre, br`), strip `style`/`on*`
  attributes, restrict `a[href]` to `https?:`/`mailto:` (kills `javascript:`), force
  `rel="noopener noreferrer nofollow"` on links. The DB must never store a `<script>`.
- Sanitize/escape again at render (defense in depth — old rows may predate the sanitizer).
  `dangerouslySetInnerHTML` only ever receives sanitizer output.
- No base64 images in content (sanitizer strips `img` or restricts `src` to https) — also keeps
  payloads under the body cap.
- CSP is the backstop, not the control (we ship `'unsafe-inline'` for Next compatibility —
  documented limitation).

## Stripe webhook

- `stripe.webhooks.constructEvent(await request.text(), sig, secret)` — RAW body, never
  `request.json()` first (stream is consumed once); constructEvent is timing-safe, don't
  hand-verify.
- Check `event.type` before touching `event.data.object`; **idempotent fulfillment** — dedupe by
  `event.id` (an event delivered twice must not double-grant or double-insert).
- Entitlement flips ONLY on verified webhook (`checkout.session.completed`), never because the
  client reached the success URL — the success page validates the session for UX, not for granting
  access.
- For anything money-critical, re-fetch the object from the Stripe API rather than trusting event
  payload fields. Return 200 fast; webhook handler stays on the Node runtime.

## Headers & config (implemented in next.config.ts — keep true)

`poweredByHeader: false` + `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo off), CSP
with `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`. When
Stripe JS gets embedded (Elements), extend CSP with the Stripe sources; for redirect-to-Checkout
nothing changes.

## OWASP API Security Top 10 (2023) mapping

| #     | Risk                         | drafty control                                                                    |
| ----- | ---------------------------- | --------------------------------------------------------------------------------- |
| API1  | Object-level authz           | ownership inside every query; 404 for not-owned                                   |
| API2  | Broken auth                  | httpOnly cookies, HS256 pinned, bcrypt 12, dummy compare, rate limits             |
| API3  | Property-level authz         | Zod-validated fields only; no `...body` spreads                                   |
| API4  | Resource consumption         | body caps, rate limits, pagination clamp, no evil regex                           |
| API5  | Function-level authz         | auth in handler, middleware UX-only                                               |
| API6  | Sensitive business flows     | register rate-limited (account minting)                                           |
| API7  | SSRF                         | never fetch user-supplied URLs server-side (no remote image fetch)                |
| API8  | Misconfiguration             | security headers, no x-powered-by, generic errors, raw-body webhook               |
| API9  | Inventory                    | every `route.ts` intentional — `find src/app/api -name route.ts` and justify each |
| API10 | Unsafe 3rd-party consumption | webhook payload untrusted until signature-verified; Zod on external responses     |

## Audit process (run on demand or pre-promote)

1. **Scope**: default = `git diff --name-only origin/main...HEAD`; `--full` = all of `src/app/api` +
   `src/services` + `src/lib/auth` + `src/lib/security`.
2. Walk every route against the per-route checklist; walk auth/session rules against the code.
3. **Grep sweeps** (candidates → verify each hit):

   ```bash
   grep -rn "request.json()" src/app/api          # must be readJsonBody instead
   grep -rn "db\." src/app/api                     # routes must not touch Drizzle
   grep -rLn "requireAuth" src/app/api/v1 --include=route.ts   # vs public allowlist
   grep -rn "dangerouslySetInnerHTML\|innerHTML" src --include="*.tsx"  # sanitizer output only?
   grep -rn "\.regex(" src/validators src/app      # linear? length-capped first?
   grep -rn "sql\.raw\|sql\`" src                  # parameterized only
   grep -rn "\.\.\.body\|\.\.\.data" src/app/api src/services  # mass assignment
   grep -rn "redirect" src/app src/middleware.ts   # ?redirect= validated as relative?
   ```

4. **Report**: severity-tiered — CRITICAL (block merge) / HIGH / MEDIUM / LOW, each as
   `Issue | file:line | what an attacker could do | fix`. End with a per-category PASS/FAIL summary.
   No findings → say so explicitly and list what was checked.

## Public-repo hygiene (job submission!)

- `scripts/check-secrets.mjs` gates every commit, but it can't fix history: before submission run
  `git log --all -p -S "sk_test" -S "whsec_" -S "JWT_SECRET"` (or gitleaks) over the FULL history.
  Stripe TEST keys are still keys — graders notice them.
- `.env.example` ships placeholders only; no real emails or personal data in seeds/fixtures;
  `data/`, `.env*`, `DESIGN_REFERENCE.md`, `.design/` stay gitignored.

## Implemented controls inventory (audit that they're USED, not just present)

`src/lib/security/rate-limit.ts` (in-memory sliding window + `enforceRateLimit`) ·
`src/lib/security/read-json-body.ts` (CL precheck + stream cap) · dummy-hash login compare · SHA-256
refresh tokens at rest + rotation · pinned HS256 (both verifiers) · security headers in
`next.config.ts` · secret scan in `.husky/pre-commit`.
