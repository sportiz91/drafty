---
name: next-best-practices
description:
  Next.js 15 App Router rules for drafty — RSC boundaries, async APIs, server actions vs route
  handlers, Stripe webhook raw body, auth cookies, hydration. Apply when writing or reviewing ANY
  page, layout, route handler, server action, or middleware in this repo.
---

# Next.js 15 Best Practices

Tailored to drafty: Next 15.5 App Router + JWT httpOnly cookies + Stripe webhooks + TipTap.

## RSC boundaries

- `'use client'` at the leaves only — never on a layout/page. Pages stay server components; wrap
  only interactive bits (editor, nav active-state) in small client components.
- Client components are never `async`. Fetch in the server parent, pass data down.
- Server→client props must be JSON-serializable: no functions, `Date`, `Map`, class instances.
  Drizzle rows with timestamps → convert before passing (`.toISOString()` or epoch number).
- Exception: server actions CAN be passed as props (`<form action={...}>`).
- TipTap/window-dependent libs: `'use client'` wrapper; if SSR still breaks,
  `dynamic(() => import('./editor'), { ssr: false })` — allowed only inside a client component in
  Next 15.

## Async APIs (the #1 Next-15 bug source)

- `params`/`searchParams` are Promises — type them as `Promise<...>` and `await` in every page,
  layout, route handler, and `generateMetadata`.
- `cookies()`/`headers()` are async: `const store = await cookies()`. Every JWT read goes through
  this.
- `cookies()` can only be WRITTEN from server actions and route handlers — read-only in pages. JWT
  set/clear logic must live in actions or route handlers, never in a page/layout.

## Data patterns

- Reads: call Drizzle directly from server components. No internal `fetch('/api/...')`.
- Mutations from our own UI (register, login, save doc): **server actions** — they can set httpOnly
  cookies and `redirect()` in one place.
- Route handlers (`app/api/*`) are for EXTERNAL callers only: the Stripe webhook is the canonical
  case. Don't build an internal REST layer for the app's own pages.
- Wrap the session-from-cookie lookup in React `cache()` — layout + page + generateMetadata share
  one DB hit per request.
- `Promise.all` for independent awaits; never stack sequential awaits for unrelated data.
- Next 15 is uncached by default (`fetch`, GET handlers); anything reading `cookies()` is dynamic
  automatically — do NOT sprinkle `export const dynamic = 'force-dynamic'`.

## Stripe webhook (route handler rules)

- Signature verification needs the RAW body:

  ```ts
  const body = await request.text(); // never request.json() before verify
  const sig = request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(body, sig, secret);
  ```

- Stay on the Node.js runtime (default) — Stripe SDK and SQLite need it; never `runtime='edge'`.
- Return `Response.json({ received: true })` fast; do fulfillment work before returning, but never
  make Stripe wait on slow side effects.

## Errors & redirects

- **Never wrap `redirect()`/`notFound()` in try-catch** — they throw internally. In a login action:
  `try { verify } catch { return { error } }` then `redirect()` OUTSIDE the try.
- Expected errors (bad credentials, validation) are RETURN VALUES from server actions; error
  boundaries are for the unexpected only.
- `error.tsx` is `'use client'` with `{ error, reset }`; one at root + one in the dashboard segment.
  `notFound()` for missing documents.
- Auth failures: plain `redirect('/login')` (the `unauthorized()` API is still experimental).

## File conventions

- Route groups split layouts without affecting URLs: `(marketing)/` for the landing, `(app)/` for
  the gated product — each with its own `layout.tsx`.
- Middleware does an optimistic cookie-presence check for `/(app)` routes; REAL JWT verification
  happens server-side in the data layer (`requireAuth`), never only in middleware.
- Non-route folders inside `app/` get a `_` prefix, or live in top-level `src/` dirs.

## Streaming & Suspense

- `loading.tsx` in a segment = free Suspense boundary — add one to the dashboard.
- Any client component calling `useSearchParams()` MUST be wrapped in `<Suspense>` or the whole page
  bails to CSR (classic landing-page footgun with UTM readers).

## Hydration safety

- No locale/timezone-dependent date formatting in RSC output ("last edited" timestamps: format with
  a fixed locale/UTC, or render client-side after mount).
- No `window`/`localStorage`/`Math.random()` in render paths; `useId()` for ids; valid HTML nesting
  in marketing copy (no `<div>` inside `<p>`).

## Metadata, image, font

- Root layout: `title: { default: 'Drafty', template: '%s | Drafty' }`. `generateMetadata` only
  where content varies (document title); share its fetch with the page via `cache()`.
- `next/image` always; `priority` on the landing hero (LCP); `sizes` whenever using `fill`.
- One `next/font` call in the root layout with a CSS variable for Tailwind — never `<link>` fonts,
  never instantiate fonts inside components.
