import crypto from 'crypto';

import { expect, test, type Page } from '@playwright/test';
import Database from 'better-sqlite3';

/**
 * Grants an active subscription by writing the entitlement row directly to
 * the SQLite file — exactly what the verified webhook does in production.
 * Keeps the document CRUD suite runnable everywhere (CI has no Stripe
 * secrets); the real payment path is covered by billing.spec.ts.
 */
function grantSubscription(email: string): void {
  const db = new Database('data/drafty.db');
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
    | { id: string }
    | undefined;

  if (!user) {
    db.close();
    throw new Error(`grantSubscription: no user for ${email}`);
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  db.prepare(
    `INSERT INTO subscriptions
       (id, user_id, stripe_subscription_id, stripe_customer_id, status,
        current_period_end, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?)`
  ).run(
    crypto.randomUUID(),
    user.id,
    `sub_e2e_${crypto.randomUUID()}`,
    `cus_e2e_${crypto.randomUUID()}`,
    nowSeconds + 86_400,
    nowSeconds,
    nowSeconds
  );
  db.close();
}

function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@drafty.test`;
}

async function registerSubscriber(page: Page, email: string): Promise<void> {
  await page.goto('/register');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/documents/);

  grantSubscription(email);
  await page.reload();
  await expect(page.getByTestId('workspace')).toBeVisible();
}

test('full document lifecycle: create, write, autosave, persist, rename, delete', async ({
  page,
}) => {
  // Longest flow in the suite: against the local dev server its many
  // first-ever navigations compile on demand, so it needs the 3x budget.
  test.slow();

  const email = uniqueEmail('docs');
  await registerSubscriber(page, email);

  // Non-subscribers saw the upgrade card; subscribers see the workspace.
  await expect(page.getByTestId('empty-state')).toBeVisible();

  // Create
  await page.getByTestId('new-document-button').click();
  await expect(page).toHaveURL(/\/documents\/[0-9a-f-]{36}/);
  await expect(page.getByTestId('document-title')).toHaveValue('Untitled');

  // Write → autosave
  await page.locator('[data-id="editor-content"]').click();
  await page.keyboard.type('Hello from the e2e suite');
  await expect(page.getByTestId('save-status')).toHaveText('Saved', {
    timeout: 10_000,
  });

  // Persistence across reload
  await page.reload();
  await expect(page.locator('[data-id="editor-content"]')).toContainText(
    'Hello from the e2e suite'
  );

  // Rename
  await page.getByTestId('document-title').fill('My first doc');
  await expect(page.getByTestId('save-status')).toHaveText('Saved', {
    timeout: 10_000,
  });
  await expect(page.getByTestId('document-link').first()).toContainText(
    'My first doc'
  );

  // Persistence across logout/login (acceptance criterion). This is the
  // suite's first hit to both the logout route and /login, so the dev server
  // compiles both on demand — give the navigation a wider window.
  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();
  await expect(page.getByTestId('document-link').first()).toContainText(
    'My first doc'
  );

  // Delete (two-step confirm)
  await page.getByTestId('document-link').first().click();
  await page.getByTestId('delete-document-button').click();
  await expect(page.getByTestId('delete-document-button')).toHaveText(
    'Confirm delete?'
  );
  await page.getByTestId('delete-document-button').click();
  await expect(page).toHaveURL(/\/documents$/);
  await expect(page.getByTestId('empty-list')).toBeVisible();
});

test('documents are isolated between users (no IDOR)', async ({ browser }) => {
  // User A creates a document.
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await registerSubscriber(pageA, uniqueEmail('owner'));
  await pageA.getByTestId('new-document-button').click();
  await pageA.waitForURL(/\/documents\/[0-9a-f-]{36}/);
  const documentUrl = pageA.url();
  await contextA.close();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await registerSubscriber(pageB, uniqueEmail('intruder'));

  // API: 404, not 403 — the same answer as a nonexistent id, so document
  // ids cannot be probed for existence.
  const documentId = documentUrl.split('/').pop();
  const apiResponse = await pageB.request.get(
    `/api/v1/documents/${documentId}`
  );
  expect(apiResponse.status()).toBe(404);

  // Page: renders the not-found UI, never the document. The page's own HTTP
  // status stays 200 because loading.tsx streams the shell before the page
  // resolves, after which notFound() can no longer change the status code.
  await pageB.goto(documentUrl);
  await expect(pageB.getByTestId('not-found')).toBeVisible();
  await expect(pageB.locator('[data-id="editor-content"]')).toHaveCount(0);
  await contextB.close();
});

test('non-subscriber is blocked from documents api and ui', async ({
  page,
}) => {
  const email = uniqueEmail('free');
  await page.goto('/register');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/documents/);

  // UI: upgrade path, no workspace.
  await expect(page.getByTestId('upgrade-card')).toBeVisible();
  await expect(page.getByTestId('subscribe-button')).toBeVisible();

  // API: server-side 403, not just hidden UI.
  const response = await page.request.post('/api/v1/documents');
  expect(response.status()).toBe(403);
});
