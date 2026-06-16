# E2E tests (Playwright) → TestForge

Deterministic browser tests that run against a local dev server and upload their
results back into TestForge as a test run (dogfooding the `/api/v1/junit` API).

## One-time setup

```bash
npm install            # installs @playwright/test
npx playwright install chromium
```

## Run

```bash
npm run e2e            # starts the dev server (port 3456), seeds a fixture, runs tests
```

`globalSetup` ([global-setup.ts](global-setup.ts)) seeds a verified ADMIN account
(`e2e@testforge.local` / `E2eDemo123`) and an `e2e` project whose cases (seq 1–4)
map to the `TC-E2E-<n>` test names. It also mints a local API key into
`e2e-results/.api-key`.

JUnit output is written to `e2e-results/junit.xml`.

## Upload results to TestForge

The dev server must be running (`npm run dev` in another terminal, or rely on the
one `npm run e2e` started if you keep it up). Then:

```bash
npm run e2e:upload     # POSTs e2e-results/junit.xml to /api/v1/junit
```

The script uses `TF_API_KEY` if set, otherwise the local key from
`e2e-results/.api-key`. Override target with `TF_API_URL`, `TF_PROJECT`,
`TF_JUNIT`. Results appear as a new run under the project's **Test Runs** tab,
matched to cases via the `TC-E2E-<n>` annotation in each test name.

## Tokens / CI

These tests need no model (Claude) in the loop, so they cost no tokens and are
safe to run repeatedly or wire into CI later. (Current setup is manual upload,
local target.)
