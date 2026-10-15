import { test, expect } from '@playwright/test';
import { mockStateList, pageOf } from './fixtures/states';
import { fakeJwt } from './fixtures/auth';

// The guard redirects client-side via vue-router; under the CPU contention of
// the full suite's parallel workers the URL commit can occasionally exceed the
// default assertion timeout. A longer timeout reflects slow navigation, not a
// retry papering over wrong behavior.
const REDIRECT_TIMEOUT_MS = 10_000;

test.describe('Login', () => {
  test('redirects to /login when visiting the create page unauthenticated', async ({ page }) => {
    await page.goto('/state/new');

    await expect(page).toHaveURL('/login', { timeout: REDIRECT_TIMEOUT_MS });
  });

  test('redirects to /login when visiting the edit page unauthenticated', async ({ page }) => {
    await page.goto('/state/1/edit');

    await expect(page).toHaveURL('/login', { timeout: REDIRECT_TIMEOUT_MS });
  });

  test('state list stays accessible without authentication', async ({ page }) => {
    await page.route('**/api/estado/paginado**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(pageOf([])),
      }),
    );

    await page.goto('/');

    await expect(page).toHaveURL('/');
  });

  test('valid login stores the token and navigates to the list', async ({ page }) => {
    const token = fakeJwt();
    await mockStateList(page, []);
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token, expiresInSeconds: 3600 }),
      }),
    );

    await page.goto('/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('correct-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL('/');
    const stored = await page.evaluate(() => localStorage.getItem('estado_jwt'));
    expect(stored).toBe(token);
    // Regression: the logout button used to appear only after the 5s poll.
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });

  test('invalid login shows an error message and does not navigate', async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid username or password.' }),
      }),
    );

    await page.goto('/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.getByRole('alert')).toContainText('Invalid username or password.');
    await expect(page).toHaveURL('/login');
  });

  test('an expired token is treated as unauthenticated', async ({ page }) => {
    await page.addInitScript(
      ([key, value]) => {
        localStorage.setItem(key, value);
      },
      [
        'estado_jwt',
        `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 })).toString('base64url')}.signature`,
      ],
    );

    await page.goto('/state/new');

    await expect(page).toHaveURL('/login', { timeout: REDIRECT_TIMEOUT_MS });
  });
});
