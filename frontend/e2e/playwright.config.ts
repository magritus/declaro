import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './flows',
  fullyParallel: false,
  timeout: 60_000,
  retries: 1,
  reporter: [['html', { outputFolder: 'reports' }]],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
