import { test, expect } from '@playwright/test';

test.describe('Grades / Rating module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/uk/login');
    await page.getByTestId('login-username').fill('student');
    await page.getByTestId('login-password').fill('test12345');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/uk\/(dashboard|home|main)/, { timeout: 15_000 });
  });

  test('rating page loads and displays table', async ({ page }) => {
    await page.goto('/uk/module/rating');

    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
  });

  test('rating table has subject column', async ({ page }) => {
    await page.goto('/uk/module/rating');

    await expect(page.locator('th, [role="columnheader"]').first()).toBeVisible({ timeout: 10_000 });
  });
});
