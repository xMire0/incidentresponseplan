import { test, expect } from '@playwright/test';

test('accesses the localhost homepage through baseURL', async ({ page }) => {
  await page.goto('/'); // uses the baseURL automatically

  // await expect(page).toHaveURL('http://localhost:5173/login');

  // await expect(page.locator('body')).toBeVisible();

  // Create locators for your input fields
  const emailField = page.locator('#email');
  const passwordField = page.locator('#password');

  // Fill in values
  await emailField.fill('admin@admin.com');
  await passwordField.fill('123');

  
});
