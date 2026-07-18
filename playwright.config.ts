import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    // Test against the built Worker (wrangler dev) — not `astro dev`, which would
    // render draft posts (the draft filter allows them when import.meta.env.DEV).
    command: 'npm run build && npx wrangler dev --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:4321' },
});
