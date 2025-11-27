import { test, expect } from '@playwright/test';

test('should load the application and display "NetPack Parser"', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('NetPack Parser')).toBeVisible();
});