import { defineConfig } from "@playwright/test";

// E2E runs against a local dev server (port 3456). globalSetup seeds a verified
// ADMIN account + an "e2e" project whose cases map to the test names
// (TC-E2E-<n>), and mints a local API key for uploading results.
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  // Playwright's 30s default assumes a built app. This suite runs against
  // `next dev`, where the first request to a route pays for its on-demand
  // compile — measured on this repo at roughly double the warm cost, and the
  // long multi-route tests (TC-83's twelve routes, TC-80's six phases plus a
  // 15s `toPass` poll) sit close enough to 30s warm that a cold CI worker tips
  // them over. Both failed that way on unrelated PRs, and TC-80 fails cold on
  // `main` too. 60s is a budget that matches what the tests actually do; a
  // genuinely hung test still fails, just 30s later.
  timeout: 60_000,
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
    // TF_ALLOW_ANY_WEBHOOK_HOST (F-08) and TF_ALLOW_INSECURE_INTEGRATION_URL
    // (F-07): both e2e specs point the app at a local http receiver/mock, which
    // the production host/scheme guards would otherwise reject. CRON_SECRET
    // lets the issue-sync spec drive the guarded cron endpoint.
    // Provider calls happen server-side, so page.route() cannot intercept them —
    // the mock must be a real HTTP server the app can reach.
    // F-20: point the app at the local mock IdP (e2e/fixtures/mock-oidc.ts) on a
    // fixed port so oidcConfig() is populated at dev-server boot. The mock binds
    // 9797 inside the OIDC spec.
    // F-34: same idea for the mock LDAP directory (e2e/fixtures/mock-ldap.ts),
    // which binds 9798 inside the LDAP spec. Local password login stays enabled
    // — every other spec logs in with the seeded local account, and LDAP is only
    // consulted as a fallback after a local password miss.
    // F-41: the instance console is dormant without a credential, so the spec
    // needs one configured at dev-server boot (same shape as the OIDC/LDAP
    // mocks above). The password is long on purpose — anything under 24 chars
    // leaves the feature disabled.
    command:
      "TF_SUPERADMIN_USER=e2e-superadmin TF_SUPERADMIN_PASSWORD=e2e-superadmin-password-long-enough TF_ALLOW_ANY_WEBHOOK_HOST=1 TF_ALLOW_INSECURE_INTEGRATION_URL=1 CRON_SECRET=e2e-cron-secret TF_OIDC_ISSUER=http://127.0.0.1:9797 TF_OIDC_CLIENT_ID=testforge-e2e TF_OIDC_CLIENT_SECRET=e2e-oidc-secret TF_OIDC_AUTO_PROVISION=1 TF_LDAP_URL=ldap://127.0.0.1:9798 TF_LDAP_BASE_DN=dc=testforge,dc=local TF_LDAP_BIND_DN=cn=svc,dc=testforge,dc=local TF_LDAP_BIND_PASSWORD=svc-secret TF_LDAP_AUTO_PROVISION=1 TF_LDAP_ORG_SLUG=e2e-org npm run dev -- -p 3456",
    port: 3456,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
