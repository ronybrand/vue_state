import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'html',
  // Default is 5s. Client-side navigations after a mutation or auth redirect
  // occasionally take a bit longer under parallel workers without being wrong.
  expect: { timeout: 8_000 },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    // Serves the production build (`npm run build` first): the dev server
    // transforms modules on demand, which is slow enough under parallel
    // browsers to flake assertions with short timeouts. Every /api call is
    // mocked by the specs, so no backend is needed.
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
