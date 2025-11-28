import { test, expect } from '@playwright/test';

test('Login as administrator', async ({ page }) => {
    await page.goto('/');

    const emailField = page.locator('#email');
    await emailField.fill('admin@admin.com');

    const passwordField = page.locator('#password');
    await passwordField.fill('123');

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    const manageUsersButton = page.locator('button.btn-gradient.purple', { hasText: 'Manage Users' });
    await manageUsersButton.click();

    const createUserButton = page.locator('button.btn-primary', { hasText: '+ Create User' });
    await createUserButton.click();

    const usernameInput = page.locator('.form-group:has(label:text("Username")) input');
    await usernameInput.fill('AutomatedTest');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('AutomatedTest@gmail.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('AutomatedPassword123');

    const roleDropdown = page.locator('select.input');
    await roleDropdown.selectOption({ label: 'Employee' });

    const createButton = page.locator('button.btn-primary', { hasText: 'Create' }).last();
    await createButton.click();

    const viewUserButton = page.locator('.users-row', { hasText: 'AutomatedTest' }).locator('button.btn-ghost', { hasText: 'View' });
    await viewUserButton.click();

    await page.waitForTimeout(4000);

    const backButton = page.locator('button.btn-outlined', { hasText: 'Back' });
    await backButton.click();

    const editUserButton = page.locator('.users-row', { hasText: 'AutomatedTest' }).locator('button.btn-ghost', { hasText: 'Edit' });
    await editUserButton.click();

    const usernameEditInput = page.locator('.form-group:has(label:text("Username")) input');
    await usernameEditInput.fill('');
    await usernameEditInput.fill('AutomatedTestChanged');

    const updateButton = page.locator('button.btn-primary', { hasText: 'Update' });
    await updateButton.click();
});
