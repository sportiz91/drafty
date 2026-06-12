import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Local runs hit the dev server, which compiles routes on demand — first
  // navigation after a cold start can exceed the 5s default.
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    // Convention: stable selectors via data-id attributes, never CSS classes.
    testIdAttribute: 'data-id',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.CI ? 'pnpm run start' : 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // The suite hammers auth endpoints from one IP; limits are unit-tested.
    env: { RATE_LIMIT_DISABLED: 'true' },
  },
});
