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
    // Pin the port: `next dev` defaults to 3000, but the suite (and baseURL)
    // expect 3456. Without -p this only worked locally by reusing an already
    // running 3456 server; in CI there's none, so next dev bound 3000 and the
    // webServer wait timed out.
    // TF_ALLOW_ANY_WEBHOOK_HOST: notifications e2e targets a local receiver,
    // which the strict per-type host allowlist would reject.
    command: "TF_ALLOW_ANY_WEBHOOK_HOST=1 npm run dev -- -p 3456",
    port: 3456,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
