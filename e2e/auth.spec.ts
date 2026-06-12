import { expect, test } from '@playwright/test';

function uniqueEmail(tag: string): string {
  return `e2e-${tag}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@drafty.test`;
}

test('register → documents → logout → failed login → login round trip', async ({
  page,
}) => {
  const email = uniqueEmail('roundtrip');

  await page.goto('/register');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();

  await expect(page).toHaveURL(/\/documents/);
  await expect(page.getByTestId('user-email')).toHaveText(email);

  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('wrong-password');
  await page.getByTestId('auth-submit').click();
  await expect(page.getByTestId('auth-error')).toHaveText(
    'Invalid credentials'
  );

  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/documents/);
  await expect(page.getByTestId('user-email')).toHaveText(email);
});

test('unauthenticated /documents redirects to login and back after auth', async ({
  page,
}) => {
  await page.goto('/documents');
  await expect(page).toHaveURL(/\/login\?redirect=/);

  const email = uniqueEmail('redirect');
  await page.goto('/register');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/documents/);

  // Authenticated users are bounced away from the auth pages.
  await page.goto('/login');
  await expect(page).toHaveURL(/\/documents/);
});

test('duplicate email registration shows the conflict error', async ({
  page,
}) => {
  const email = uniqueEmail('dup');

  await page.goto('/register');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/documents/);

  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto('/register');
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill('password123');
  await page.getByTestId('auth-submit').click();
  await expect(page.getByTestId('auth-error')).toHaveText(
    'Email already registered'
  );
});
