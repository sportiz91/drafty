# Write-up

## 1. How does the app decide a user is an active subscriber?

A single source of truth: the `subscriptions` row in the database, which is written **only** by the
signature-verified Stripe webhook handler — never by client code, never by the checkout success
redirect. `isActiveSubscriber(userId)` answers true when:

- a subscription row exists for the user with status `active` or `trialing`, **and**
- its `current_period_end` is in the future — a safety net so that even if a cancellation or
  failed-renewal webhook were missed, entitlement still expires when the paid period does.

The check runs **server-side on every protected surface**: the documents REST API
(`requireSubscriber` guard → 403 "Subscription required") and the `/documents` server components
(which render the upgrade card instead). It is deliberately _not_ baked into the JWT: the access
token lives 15 minutes and entitlement can change mid-lifetime (cancellation, payment failure), so
the token only proves identity and the database answers entitlement per request. SQLite makes this
per-request lookup effectively free.

## 2. What happens if payment succeeds but the webhook is delayed?

The user lands back on `/documents?checkout=success` and is **still a non-subscriber** — by design,
since a success redirect is forgeable (anyone can type that URL). The page shows an honest
intermediate state: "Payment received — your workspace unlocks as soon as Stripe confirms it
(usually instant). Refresh in a moment." No access is granted from the redirect.

When the delayed `checkout.session.completed` event arrives, the handler verifies the signature,
re-fetches the subscription from Stripe's API (rather than trusting payload fields), and upserts the
entitlement row — the next page load unlocks the workspace. Delivery is robust in both directions:

- **Retries**: Stripe retries undelivered/failed webhooks for days. The handler is idempotent by
  event id (a `stripe_events` table), so a retry after a partial failure can't double-fulfill;
  conversely, if fulfillment throws, the event is un-marked and a non-2xx is returned so Stripe
  _will_ retry it.
- **Worst case** (webhook never arrives): the user stays on the upgrade card and support can see the
  paid subscription in the Stripe Dashboard. With another day I'd add a reconcile-on-login fallback
  that queries Stripe by customer id — noted in the README.

## 3. One security decision and why

**Rich-text HTML is sanitized on the server, on every write.** A WYSIWYG editor's output is still
arbitrary user input: the TipTap toolbar constrains what the UI _produces_, but any authenticated
subscriber can `PATCH /api/v1/documents/:id` with raw HTML directly, so client-side constraints are
advisory. The document service runs every incoming `contentHtml` through an allowlist sanitizer
(permitted tags/attributes only — no scripts, no event handlers, no `javascript:` URLs) before it
ever reaches the database, killing stored XSS at the trust boundary instead of hoping every future
renderer remembers to escape. The sanitizer is unit-tested against a battery of XSS vectors (script
injection, event-handler attributes, protocol smuggling), and defense-in-depth backs it up:
documents are private to their owner (requests for someone else's id return 404, indistinguishable
from nonexistent — no IDOR, no existence oracle) and a restrictive CSP limits what an injected
script could do if one ever got through.
