import { defineConfig } from "@playwright/test";

// E2E runs against a local dev server (port 3456). globalSetup seeds a verified
// ADMIN account + an "e2e" project whose cases map to the test names
// (TC-E2E-<n>), and mints a local API key for uploading results.
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["junit", { outputFile: "e2e-results/junit.xml" }]],
  use: {
    baseURL: "http://localhost:3456",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 3456,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
