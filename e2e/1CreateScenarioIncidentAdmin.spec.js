import { test, expect } from '@playwright/test';
import { brotliCompress } from 'zlib';

test('Create Scenario and Incident as admin', async ({ page }) => {
  await page.goto('/'); // uses the baseURL automatically from playwright.config.js

    const emailField = page.locator('#email');
    await emailField.fill('admin@admin.com');

    const passwordField = page.locator('#password');
    await passwordField.fill('123');

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    
    await page.locator('button[type="submit"]').click({ force: true });

    const createScenarioButton = page.locator('button.btn-gradient.green');
    await createScenarioButton.click();

    const titleInput = page.locator('input[placeholder="e.g., Ransomware Detected"]');
    await titleInput.fill('Phishing attack - Automated Test Example');

    const severityDropdown = page.getByRole('combobox').first();
    await severityDropdown.selectOption({ label: 'High' });

    //const severityDropdown = page.locator('select.input');
    //await page.locator('select.input').selectOption('High');

    //await severityDropdown.click();
    //await severityDropdown.selectOption('High');

    const descriptionArea = page.locator('textarea[placeholder="Write a short description of the scenario…"]');
    await descriptionArea.fill('This is a test from playwright.');

    const questionTextarea = page.locator('textarea[placeholder="Write the question…"]');
    await questionTextarea.fill('Is this a test?');

    const urgencyDropdown = page.getByRole('combobox').nth(1);
    await urgencyDropdown.selectOption({ value: 'Urgent' });

    /*
    const audienceRoles = page.getByRole('combobox').nth(2);
    await audienceRoles.click();
    await audienceRoles('button', { name: 'Analyst' }).click();
    await audienceRoles('button', { name: 'Developer' }).click();
    await audienceRoles('button', { name: 'IT' }).click();
    */

    await page.getByRole('button', { name: /All roles/i }).click();
    await page.getByRole('button', { name: 'Analyst' }).click();
    await page.getByRole('button', { name: 'Developer' }).click();

    const option1Input = page.locator('input[placeholder="Option 1 text"]');
    await option1Input.fill('No');

    const option1Score = page.locator('input.input.score').first();
    await option1Score.fill('');
    await option1Score.fill('0');

    const kindDropdown1 = page.locator('select.input.kind').first();
    await kindDropdown1.selectOption({ value: 'incorrect' });

    const option2Input = page.locator('input[placeholder="Option 2 text"]');
    await option2Input.fill('Yes');

    const option2Score = page.locator('input.input.score').nth(1);
    await option2Score.fill('');
    await option2Score.fill('10');

    const kindDropdown2 = page.locator('select.input.kind').nth(1);
    await kindDropdown2.selectOption({ value: 'correct' });

    await page.getByRole('button', { name: '+ Add from bank' }).click();
    //const addFromBank = page.locator('button.btn-ghost');
    //await addFromBank.click();

    const bankDropdown = page.locator('select.input.bank-select');
    await bankDropdown.selectOption({
    label: 'When should communication with management occur?'
  });

    await page.getByRole('button', { name: 'Add as copy' }).click();
    //const addAsCopy = page.locator('button.btn-primary');
    //await addAsCopy.click();

    const saveScenarioButton = page.getByRole('button', { name: 'Save scenario' });
    await expect(saveScenarioButton).toBeEnabled({ timeout: 5000 });
    await saveScenarioButton.click();

    // Create Incident from Scenario
    const createIncidentButton = page.locator('button.btn-primary', { hasText: '+ Create Incident' });
    await createIncidentButton.click();

    // const statusDropdown = page.locator('select.input');
    // await statusDropdown.selectOption({ value: 'InProgress' });

    const startDateInput = page.locator('input[type="datetime-local"]').first();
    await startDateInput.fill('2025-11-27T08:00');

    const completionDateInput = page.locator('input[type="datetime-local"]').nth(1);
    await completionDateInput.fill('2025-12-12T23:55');

    const createFinalIncidentButton = page.locator('button.btn-primary', { hasText: 'Create Incident' });
    await createFinalIncidentButton.click();

  
});