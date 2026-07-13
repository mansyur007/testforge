// TestForge integration for Cypress. Implemented as a setupNodeEvents plugin
// (not a Mocha reporter) so it runs once per `cypress run` in the Node process:
// it opens a run at before:run, streams each spec's results at after:spec, and
// completes the run at after:run.
//
// cypress.config.js:
//   const { registerTestForge } = require("testforge-cypress-reporter");
//   module.exports = defineConfig({
//     e2e: { setupNodeEvents(on, config) { registerTestForge(on, config); return config; } },
//   });
//
// Config from env: TESTFORGE_URL, TESTFORGE_TOKEN, TESTFORGE_PROJECT,
// TESTFORGE_RUN_NAME. Missing config = no-op (never breaks the run).

import { TestForgeClient } from "./lib/client.js";

// Cypress test state -> TestForge status.
function mapState(state) {
  switch (state) {
    case "passed":
      return "PASSED";
    case "pending":
    case "skipped":
      return "SKIPPED";
    default:
      return "FAILED"; // "failed"
  }
}

export function registerTestForge(on, _config, options = {}) {
  const client = new TestForgeClient({
    url: options.url || process.env.TESTFORGE_URL,
    token: options.token || process.env.TESTFORGE_TOKEN,
    project: options.project || process.env.TESTFORGE_PROJECT,
  });
  if (!client.configured) {
    console.warn(
      "[testforge] not configured (need url, token, project) — skipping."
    );
    return;
  }
  const runName =
    options.name ||
    process.env.TESTFORGE_RUN_NAME ||
    `Cypress ${new Date().toISOString()}`;
  let enabled = true;
  let posted = 0;
  let unmatched = 0;

  on("before:run", async () => {
    try {
      await client.loadCaseMap();
      await client.createRun({
        name: runName,
        source: "CYPRESS",
        origin: process.env.CI ? "CI · Cypress" : "Local · Cypress",
      });
    } catch (e) {
      enabled = false;
      console.warn(`[testforge] could not start run: ${e.message}`);
    }
  });

  on("after:spec", async (_spec, results) => {
    if (!enabled || !results?.tests) return;
    for (const t of results.tests) {
      const name = Array.isArray(t.title) ? t.title.join(" ") : String(t.title);
      const caseId = client.resolveCaseId(name);
      if (!caseId) {
        unmatched++;
        continue;
      }
      const lastAttempt = t.attempts?.[t.attempts.length - 1];
      const durationMs = lastAttempt?.wallClockDuration ?? t.duration ?? 0;
      try {
        await client.postResult({
          caseId,
          status: mapState(t.state),
          comment: t.displayError || undefined,
          elapsedSeconds: Math.round(durationMs / 1000),
        });
        posted++;
      } catch (e) {
        console.warn(`[testforge] result post failed: ${e.message}`);
      }
    }
  });

  on("after:run", async () => {
    if (!enabled) return;
    try {
      await client.completeRun();
      console.log(
        `[testforge] run completed — ${posted} result(s) posted` +
          (unmatched ? `, ${unmatched} test(s) without a TC-id` : "")
      );
    } catch (e) {
      console.warn(`[testforge] could not complete run: ${e.message}`);
    }
  });
}

export default registerTestForge;
