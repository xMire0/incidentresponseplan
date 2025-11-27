import { test, expect } from '@playwright/test';
import { brotliCompress } from 'zlib';

test('accesses the localhost homepage through baseURL', async ({ page }) => {
  await page.goto('/'); // uses the baseURL automatically

  // await expect(page).toHaveURL('http://localhost:5173/login');

  // await expect(page.locator('body')).toBeVisible();


});