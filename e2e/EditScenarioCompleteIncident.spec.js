import { test, expect } from '@playwright/test';
import { brotliCompress } from 'zlib';

test('Edit scenario and mark complete incident as admin', async ({ page }) => {
    await page.goto('/');

    const emailField = page.locator('#email');
    await emailField.fill('admin@admin.com');

    const passwordField = page.locator('#password');
    await passwordField.fill('123');


    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    const openScenariosButton = page.locator('button.btn-gradient.blue', {hasText: 'Open scenarios'});
    await openScenariosButton.click();


    const scenarioRow = page.locator('.vs-row', {hasText: 'Phishing attack - Automated Test Example'}); 

    const viewScenarioButton = scenarioRow.locator('button.btn-ghost:text-is("View")');
    await viewScenarioButton.click();

    await page.waitForTimeout(2000);

    const editScenarioButton = page.locator('button.btn-outlined', { hasText: 'Edit Scenario' });
    await editScenarioButton.click();

    //const viewScenarioButton = scenarioRow.locator('button.btn-ghost', { hasText: 'View' });
    //await viewScenarioButton.click();

    const scenarioTitleInput = page.locator('input.input').first();
    await scenarioTitleInput.fill('Phishing attack - Automated Test Example (CHANGED VERSION)');


    //const scenarioTitleInput = page.locator('input.input[value="Phishing attack - Automated Test Example"]');
    //await scenarioTitleInput.fill('Phishing attack - Automated Test Example (CHANGED VERSION)');


    const saveChangesButton = page.locator('button.btn-primary', { hasText: 'Save changes' });
    await saveChangesButton.click();

    const backToViewButton = page.locator('button.btn-outlined', { hasText: 'Back to view' });
    await backToViewButton.click();


    const viewIncidentsButton = page.locator('button.btn-outlined', { hasText: 'View Incidents' });
    await viewIncidentsButton.click();

    const viewDetailsButton = page.locator('button.btn-ghost', { hasText: 'View details' });
    await viewDetailsButton.click();

    page.once('dialog', async dialog => {
    console.log('Dialog text:', dialog.message());
    await dialog.accept(); // accepterer "OK"
});

    const markCompletedButton = page.locator('button.btn-primary', { hasText: 'Mark as Completed' });
    await markCompletedButton.click();

    

});