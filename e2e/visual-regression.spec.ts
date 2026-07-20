import { expect, test } from '@playwright/test';

test.describe('Visual regression — login page', () => {
  test('login page matches snapshot', async ({ page }) => {
    await page.goto('/uk/login');
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });
});

test.describe('Visual regression — register page', () => {
  test('register page matches snapshot', async ({ page }) => {
    await page.goto('/uk/register');
    await expect(page).toHaveScreenshot('register-page.png', {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    });
  });
});
