import { expect, test } from '@playwright/test';

/**
 * Full payment truth test: drives the real Stripe-hosted Checkout (test
 * mode) and asserts the webhook flips entitlement server-side.
 *
 * Requires: Stripe env in .env.local AND `stripe listen --forward-to
 * localhost:3000/api/vendor/stripe/webhooks` running. Gated behind
 * STRIPE_E2E=1 so CI (no Stripe secrets) skips it honestly.
 */
test.describe('billing', () => {
  test.skip(
    !process.env.STRIPE_E2E,
    'set STRIPE_E2E=1 with Stripe env + stripe listen running'
  );

  test('subscribe via hosted checkout unlocks the workspace', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const email = `e2e-billing-${Date.now()}@drafty.test`;

    await page.goto('/register');
    await page.getByTestId('auth-email').fill(email);
    await page.getByTestId('auth-password').fill('password123');
    await page.getByTestId('auth-submit').click();
    await expect(page).toHaveURL(/\/documents/);

    // Non-subscriber state: upgrade path, no workspace.
    await expect(page.getByTestId('upgrade-card')).toBeVisible();

    await page.getByTestId('subscribe-button').click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });

    await page.locator('#cardNumber').fill('4242 4242 4242 4242');
    await page.locator('#cardExpiry').fill('12 / 34');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('E2E Tester');
    // Country determines which address fields are required; US needs ZIP only.
    await page.locator('#billingCountry').selectOption('US');
    await page.locator('#billingPostalCode').fill('12345');

    // Stripe's page uses data-testid; our getByTestId is mapped to data-id.
    await page.locator('[data-testid="hosted-payment-submit-button"]').click();

    await page.waitForURL(/\/documents\?checkout=success/, {
      timeout: 60_000,
    });

    // Entitlement arrives via webhook — poll with reloads, never trust the
    // redirect alone.
    await expect(async () => {
      await page.reload();
      await expect(page.getByTestId('workspace')).toBeVisible({
        timeout: 2_000,
      });
    }).toPass({ timeout: 45_000 });

    await expect(page.getByTestId('manage-billing-button')).toBeVisible();
  });
});
