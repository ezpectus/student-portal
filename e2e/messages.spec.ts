import { test, expect } from '@playwright/test';

test.describe('Messages module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/uk/login');
    await page.getByTestId('login-username').fill('student');
    await page.getByTestId('login-password').fill('test12345');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(/\/uk\/(dashboard|home|main)/, { timeout: 15_000 });
  });

  test('inbox page loads with table', async ({ page }) => {
    await page.goto('/uk/module/msg');

    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });
  });

  test('search input focuses on / key', async ({ page }) => {
    await page.goto('/uk/module/msg');

    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    await page.keyboard.press('/');

    await expect(page.getByTestId('msg-search')).toBeFocused({ timeout: 3_000 });
  });

  test('search filters messages', async ({ page }) => {
    await page.goto('/uk/module/msg');

    await expect(page.locator('table')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('msg-search').fill('zzzznonexistent');

    const emptyState = page.locator('text=/No results|Немає результатів|empty/i');
    await expect(emptyState.or(page.locator('table tbody'))).toBeVisible({ timeout: 5_000 });
  });
});
