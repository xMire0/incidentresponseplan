import { test, expect } from '@playwright/test';
import { brotliCompress } from 'zlib';

test('Login as administrator', async ({ page }) => {
    await page.goto('/'); //uses the baseURL automatically from playwright.config.js

    const emailField = page.locator('#email');
    await emailField.fill('admin@admin.com');

    const passwordField = page.locator('#password');
    await passwordField.fill('123');


    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    

});