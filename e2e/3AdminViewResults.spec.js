import { test, expect } from '@playwright/test';
import { brotliCompress } from 'zlib';

test('Login as administrator and view incident results', async ({ page }) => {
    await page.goto('/');

    const emailField = page.locator('#email');
    await emailField.fill('admin@admin.com');

    const passwordField = page.locator('#password');
    await passwordField.fill('123');


    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    const openResultsButton = page.locator('button.btn-gradient.blue', {
        hasText: 'Open results'
    });
    await openResultsButton.click();

    const scenarioRow = page.locator('.t-row', {
    hasText: 'Phishing attack - Automated Test Example'
});
    const viewButton = scenarioRow.getByRole('button', { name: 'View' });
    await viewButton.click();

    


});