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
map to the `TC-E2E-<n>` test names. That project's cases, suites and runs are
**hard-reset every run** before the fixture is re-seeded: the case list is shared
state the whole suite reads by title and by position, so cases left behind by
earlier runs used to duplicate the fixture titles and push rows off the first
page. Anything a spec needs must therefore be created by that spec, not
inherited from a previous run. It also settles the local API key — a fixed
token (`E2E.apiKey`, upserted by its hash so concurrent runs converge on one row
instead of revoking each other) which it writes to `e2e-results/.api-key` for
the upload script. Specs read the token from `E2E.apiKey` directly.

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

## Uploading to production (run locally, report to prod)

The plumbing is env-driven, so no code change is needed — just point the upload at
prod. One-time on `testforge.emha.space`: create an account, create a project with
slug `e2e`, and create an API key (Settings → API Keys).

```bash
export TF_API_URL=https://testforge.emha.space
export TF_PROJECT=e2e
export TF_API_KEY=tf_xxx          # prod key — keep it out of git

node scripts/seed-cases.mjs       # once: creates TC-E2E-1..4 in the prod project
npm run e2e                       # run the suite locally → e2e-results/junit.xml
npm run e2e:upload                # POST results to the prod project's Test Runs
```

The API key's user must be a member of the target project (tenant isolation).

## Tokens / CI

These tests need no model (Claude) in the loop, so they cost no tokens and are
safe to run repeatedly or wire into CI later. (Current setup is manual upload,
local target.)
