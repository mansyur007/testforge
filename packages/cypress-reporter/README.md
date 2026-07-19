# testforge-cypress-reporter

A [Cypress](https://cypress.io) integration that streams results to
[TestForge](https://github.com/mansyur007/testforge).

It is a **`setupNodeEvents` plugin**, not a Mocha reporter — so it runs once per
`cypress run` in the Node process, reliably: it opens a run at `before:run`,
posts each spec's results at `after:spec`, and completes the run at
`after:run`. (Mocha reporters are re-instantiated per spec in Cypress, which
makes a single streamed run and async network posts unreliable.)

## Install

```bash
npm install -D testforge-cypress-reporter
```

Requires Node.js 18+.

## Configure

```js
// cypress.config.js
const { defineConfig } = require("cypress");
const { registerTestForge } = require("testforge-cypress-reporter");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      registerTestForge(on, config, { project: "web" });
      return config;
    },
  },
});
```

Connection via environment variables (or the options object):

| Env | Option | Description |
| --- | --- | --- |
| `TESTFORGE_URL` | `url` | TestForge base URL |
| `TESTFORGE_TOKEN` | `token` | WRITE-scoped API key |
| `TESTFORGE_PROJECT` | `project` | Project slug |
| `TESTFORGE_RUN_NAME` | `name` | Run name (default: `Cypress <timestamp>`) |

If any of URL / token / project is missing, the plugin logs a warning and does
nothing — it never fails your run.

## Matching tests to cases

Put a `TC-<SLUG>-<n>` id in the test title:

```js
it("TC-WEB-001 valid login redirects to dashboard", () => { /* ... */ });
```

States map as: `passed → PASSED`, `pending`/`skipped → SKIPPED`,
`failed → FAILED`. The display error (truncated to 5000 chars) is stored as the
result comment.

## License

MIT
