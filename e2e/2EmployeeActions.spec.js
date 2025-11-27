import { test, expect } from '@playwright/test';
import { brotliCompress } from 'zlib';

async function answerQuestionRandomly(question) {
    const options = question.locator('.opts .opt');
    const count = await options.count();

    if (count === 0) {
        throw new Error('No answer options found in question.');
    }

    const randomIndex = Math.floor(Math.random() * count);
    await options.nth(randomIndex).click();
}

test('Login as employee and answer incident test', async ({ page }) => {
    await page.goto('/');

    const emailField = page.locator('#email');
    await emailField.fill('employee@employee.com');

    const passwordField = page.locator('#password');
    await passwordField.fill('123');

    const loginButton = page.locator('button[type="submit"]');
    await loginButton.click();

    const incidentCard = page.locator('.card-inner', { 
        hasText: 'Phishing attack - Automated Test Example' 
    });

    await incidentCard.getByRole('button', { name: 'Start incident' }).click();

    await page.waitForSelector('article.q-card');

    const questions = page.locator('article.q-card');
    const totalQuestions = await questions.count();

    for (let i = 0; i < totalQuestions; i++) {
        const question = questions.nth(i);
        await answerQuestionRandomly(question);
    }

    const submitButton = page.getByRole('button', { name: 'Submit answers' });
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    await submitButton.click();
});
