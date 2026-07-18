import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('login page loads with correct elements', async ({ page }) => {
    await page.goto('/uk/login');

    await expect(page.getByTestId('login-username')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
  });

  test('login with demo credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/uk/login');

    await page.getByTestId('login-username').fill('student');
    await page.getByTestId('login-password').fill('test12345');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(/\/uk\/(dashboard|home|main)/, { timeout: 15_000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/uk/login');

    await page.getByTestId('login-username').fill('wronguser');
    await page.getByTestId('login-password').fill('wrongpass');
    await page.getByTestId('login-submit').click();

    await expect(page.locator('[role="alert"], .text-destructive, .text-status-danger-300')).toBeVisible({ timeout: 5_000 });
  });
});
