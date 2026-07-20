import { expect, test } from '@playwright/test';

test.describe('Calendar module', () => {
  test('calendar page loads', async ({ page }) => {
    await page.goto('/uk/login');

    await page.getByTestId('login-username').fill('admin');
    await page.getByTestId('login-password').fill('admin12345');
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/uk\/.*/);

    await page.goto('/uk/module/calendar');
    await expect(page.locator('h1, h2')).toContainText(/calendar|календар/i, { timeout: 10_000 });
  });
});

test.describe('Chat module', () => {
  test('chat page loads with room list', async ({ page }) => {
    await page.goto('/uk/login');

    await page.getByTestId('login-username').fill('admin');
    await page.getByTestId('login-password').fill('admin12345');
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/uk\/.*/);

    await page.goto('/uk/module/chat');
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Analytics module', () => {
  test('analytics page loads with charts', async ({ page }) => {
    await page.goto('/uk/login');

    await page.getByTestId('login-username').fill('admin');
    await page.getByTestId('login-password').fill('admin12345');
    await page.getByTestId('login-submit').click();

    await page.waitForURL(/\/uk\/.*/);

    await page.goto('/uk/module/analytics');
    await expect(page.locator('body')).toBeVisible({ timeout: 10_000 });
  });
});
