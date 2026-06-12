---
name: unit-tests
description:
  Write and run Jest + React Testing Library unit tests for drafty — colocated specs, AAA structure,
  mock externals, 80% coverage target. Use when the user asks to generate tests, run tests, check
  coverage, or do TDD on a module.
---

# Unit Tests

Jest 30 + React Testing Library on top of `next/jest` (jsdom). Config: `jest.config.mjs`.

## Modes

- `--generate <path>`: write tests for an existing module
- `--run [pattern]`: run tests (`pnpm run test:unit`)
- `--coverage`: `pnpm run test:unit:coverage`, report the 4 metrics + prioritized gaps
- `--tdd <feature>`: strict RED → GREEN → REFACTOR, running tests to verify each phase

## Conventions

- **Colocated specs**: `foo.ts` → `foo.spec.ts`, same directory. E2E lives in `e2e/` (Playwright,
  NOT Jest — never mix).
- **AAA structure**: Arrange / Act / Assert, one logical assertion per test.
- **Mock external deps** (DB, Stripe, fetch, next/navigation) — never mock the unit under test.
  `jest.mock()` at module level; type mocks explicitly.
- **Independent tests**: no shared mutable state; each test builds its own fixtures.
- **RTL queries**: prefer `getByRole`/`getByLabelText`/`getByText`; `@testing-library/user-event`
  for interactions; never query by CSS class.
- **Server code** (services, route handlers): plain Jest, `testEnvironment: node` via
  `/** @jest-environment node */` docblock when jsdom gets in the way.
- **Coverage target**: 80%+ on statements/branches/functions/lines for `src/lib` and services; UI
  components are tested for behavior, not pixel output.

## Gotchas (hard-won)

- Jest 30 renamed the CLI flag: use `--testPathPatterns` (plural), not `--testPathPattern`.
- `next/jest` handles TS, CSS modules, next/image and fonts — don't add manual transforms.
- Async Server Components can't be rendered by RTL — test their data functions directly instead.
