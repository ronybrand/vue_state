import { test, expect } from '@playwright/test';
import { mockStateList } from './fixtures/states';
import { mockInfo } from './fixtures/info';

test('navigates to the AI assistant and submits a question', async ({ page }) => {
  await mockStateList(page);
  await mockInfo(page);
  let receivedQuestion: unknown;
  await page.route('**/api/ask', async (route) => {
    receivedQuestion = route.request().postDataJSON().question;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answer: 'Brazil has 27 states.' }),
    });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Ask AI' }).click();
  await expect(page).toHaveURL(/\/ask$/);

  await page.getByRole('textbox', { name: 'Ask about Brazilian states' }).fill('How many states?');
  await page.getByRole('button', { name: 'Ask' }).click();

  await expect(page.getByRole('status')).toHaveText('Brazil has 27 states.');
  expect(receivedQuestion).toBe('How many states?');
});
