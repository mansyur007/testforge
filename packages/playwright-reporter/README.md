# testforge-playwright-reporter

A [Playwright](https://playwright.dev) reporter that streams results to
[TestForge](https://github.com/mansyur007/test-forge) live: it opens a run when
the suite starts, posts each test result as it finishes, and completes the run
at the end.

## Install

```bash
npm install -D testforge-playwright-reporter
```

Requires Node.js 18+.

## Configure

Add the reporter to `playwright.config.ts`:

```ts
export default defineConfig({
  reporter: [
    ["list"],
    ["testforge-playwright-reporter", { project: "web" }],
  ],
});
```

Provide the connection via environment variables (or reporter options):

| Env | Option | Description |
| --- | --- | --- |
| `TESTFORGE_URL` | `url` | TestForge base URL |
| `TESTFORGE_TOKEN` | `token` | WRITE-scoped API key |
| `TESTFORGE_PROJECT` | `project` | Project slug |
| `TESTFORGE_RUN_NAME` | `name` | Run name (default: `Playwright <timestamp>`) |

If any of URL / token / project is missing, the reporter logs a warning and
does nothing — it never fails your test run.

## Matching tests to cases

Put the case id in the test title (anywhere), using the `TC-<SLUG>-<n>`
convention:

```ts
test("TC-WEB-001 valid login redirects to dashboard", async ({ page }) => {
  // ...
});
```

Playwright statuses map as: `passed → PASSED`, `skipped → SKIPPED`,
`failed`/`timedOut`/`interrupted → FAILED`. The failure message (truncated to
5000 chars) is stored as the result comment. Tests without a `TC-` id are
skipped and counted in the summary line.

## Run

```bash
TESTFORGE_URL=https://testforge.example.com \
TESTFORGE_TOKEN=tf_xxx \
TESTFORGE_PROJECT=web \
npx playwright test
```

## License

MIT
