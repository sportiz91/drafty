---
name: react-best-practices
description:
  React 19 + TypeScript coding rules for drafty — architecture, components, state, forms,
  performance. Apply when writing or reviewing ANY React component, hook, or feature code in this
  repo.
---

# React Best Practices

Distilled from bulletproof-react, vercel-labs/agent-skills (react-best-practices +
composition-patterns), typescript-cheatsheets/react, react-philosophies.

## Architecture

- Feature code lives in `src/features/<feature>/` (`api/`, `components/`, `hooks/`, `types/` — only
  the subfolders the feature needs). Only genuinely shared code goes in top-level `src/components`,
  `src/hooks`, `src/lib`.
- **Never import from one feature into another.** Compose features at the route level.
- Dependency direction is one-way: `lib/shared → features → app`. Never the reverse.
- **No barrel files** (`index.ts` re-exports) — they break tree-shaking. Import by full path.
- `app/` stays thin: pages/layouts compose features; no business logic in route files.

## Components

- Never define nested render functions (`renderItems()`) — extract a component.
- Too many props → split the component or compose via `children`/slots.
- Prefer compound components sharing context over boolean-prop proliferation (`<Composer.Input/>` +
  `<Composer.Submit/>` beats `isEditing`/`isThread` flags).
- Separate explicit variant components > one component with a `variant` mega-prop, when variants
  diverge structurally.
- Use ternaries for conditional render, not `&&` (the `0 &&` footgun).
- `children` is the cheapest re-render optimization: JSX passed as children doesn't re-render when
  the wrapper's state changes — restructure before reaching for `memo`.
- Naming: directories kebab-case, named exports, handlers `handle*`, booleans `is*/has*`, hooks
  `use*`. File order: exported component → subcomponents → helpers → types.
- One component per file; an unexported, genuinely tiny subcomponent may stay inline — the moment it
  grows or needs its own test, it moves to its own file.
- Inside a component, keep a consistent order: hooks → effects → derived values → event handlers →
  return. Readers learn the rhythm once and never hunt.

## React 19

- **No `forwardRef`** — `ref` is a regular prop now.
- `use(Context)` instead of `useContext` (and it may be called conditionally).
- `<Context>` renders directly as a provider — no `.Provider`.
- `useActionState(fn, initial)` replaces the isPending/error/data useState triad; wire to
  `<form action={formAction}>`.
- `useFormStatus` must be called from a component INSIDE the `<form>` — use it for submit buttons
  instead of prop-drilling `isSubmitting`.
- `useOptimistic` for instant UI with automatic rollback — never hand-roll optimistic state.

## State

- Pick the tool per state category — never one global store:
  - Component state → `useState` / `useReducer`. Start local, lift only when needed.
  - Server cache → React Query (or server-component props). **Never store server data in a client
    store.**
  - Form state → react-hook-form + zod. Never hand-roll complex forms.
  - URL state → the router (params/searchParams) is the store; don't duplicate it.
  - App UI state (modals, theme) → context for low-velocity data only.
- **Derive, don't store**: never `setState` in an effect to compute derived state — compute in
  render or `useMemo`. (#1 React anti-pattern.)
- `useState(() => expensiveFn())` — lazy initializer, never `useState(expensiveFn())`.

## Effects

- `useEffect` is ONLY for synchronizing with systems outside React — DOM/browser APIs, timers, SDK
  instances (e.g. the TipTap editor), subscriptions.
- Never in an effect: derived data (compute in render or `useMemo`), reacting to a user event
  (notifications, analytics, and mutations belong in the handler that caused them), or fetching
  server data (React Query / server components own that in this repo).
- External-store subscriptions → `useSyncExternalStore`, not addEventListener-in-an-effect.
- Any async effect must guard against races: `let active = true` in the effect body, check it before
  every `setState`, cleanup flips it to `false`.

## TypeScript

- `children?: React.ReactNode`. `JSX.Element` only when you mean "exactly one element".
- Wrap native elements with `Props & React.ComponentPropsWithoutRef<'button'>` (shadcn pattern).
- Discriminated unions for variant props instead of optional-everything.
- No `enum` — const maps with `as const` (+ `satisfies` for config validation).
- Convention in this repo: `type` for component props; `interface` only for extensible contracts.
- `useState<User | null>(null)` — explicit generic when the initial value doesn't reveal the full
  type; let primitives infer (`useState(0)`).
- Props are destructured in the parameter with the type annotation
  (`const Button = ({ onClick, children }: ButtonProps) =>`), props type declared above the
  component.
- Avoid `as` assertions — narrow with type guards (`instanceof`, `in`, custom predicates) so the
  compiler proves it.
- Generic components (`<Select<T> items={...}>`) when a component works over different item types —
  keep type safety instead of widening to `unknown`/union soup.

## Forms

- Zod schema is the single source of truth: `z.infer` for types, shared between the client resolver
  and the server-side re-validation. **Never trust client validation alone.**
- Server action pattern: parse with Zod, return typed `{ success, fieldErrors }` — consumed by
  `useActionState`. Expected errors are return values, not thrown.

## Performance

- Code-split at route level only; avoid chunk confetti. `next/dynamic` for heavy leaves (e.g. the
  TipTap editor).
- Keep state close to its consumers; split stores/contexts by usage area.
- Check cheap sync conditions before `await`; move `await` into the branch that uses it.
- Lists with user content: sanitize rendered HTML (TipTap output) before `dangerouslySetInnerHTML`.

## Anti-patterns (hard NO)

Cross-feature imports · barrel files · nested render functions · server data in client stores ·
context as default prop-drilling fix · tokens in localStorage · one app-wide error boundary ·
`setState`-in-effect derivation · testing implementation details · premature abstraction
("duplication is far cheaper than the wrong abstraction").
