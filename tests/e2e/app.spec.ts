import { test, expect } from '@playwright/test';

test('should load the application and display "NetTraffic Parser"', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('NetTraffic Parser');
});