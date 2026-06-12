import { expect, test } from '@playwright/test';

test('home page loads and renders the main landmark', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('main')).toBeVisible();
});
