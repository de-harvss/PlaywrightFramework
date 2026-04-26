import { defineConfig, devices } from '@playwright/test';
import { config } from './config/env.js';

// GitHub Actions sets CI=true; Azure DevOps sets TF_BUILD=true.
const isCI = process.env['CI'] ?? process.env['TF_BUILD'];

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },

  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : 2,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  // Each entry here is a named project that can be run independently.
  // Convention:
  //   - One project per API/service for API tests, named after the service
  //   - One project named 'ui' for UI tests
  //
  // To add a new service:
  //   1. Add a project here with its own testMatch and baseURL
  //   2. Add corresponding npm scripts in package.json
  //   3. Add a test step in azure-pipelines.yml
  projects: [
    {
      // API tests — no browser, purely HTTP requests via Playwright's request fixture.
      name: 'api',
      testMatch: '**/tests/api/**/*.spec.ts',
      use: {
        baseURL: config.baseApiUrl,
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
    },

    {
      // UI tests — headless Chromium.
      name: 'ui',
      testMatch: '**/tests/ui/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.baseUiUrl,
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
      },
    },
  ],
});
