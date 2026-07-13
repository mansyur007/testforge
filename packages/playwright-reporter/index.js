// TestForge reporter for Playwright. Creates a run at suite start, streams each
// test result as it finishes, and completes the run at the end. Tests are
// matched to cases by a TC-<SLUG>-<n> annotation in the test title/path.
//
// playwright.config.ts:
//   reporter: [["testforge-playwright-reporter", { project: "web" }]]
// Config falls back to env: TESTFORGE_URL, TESTFORGE_TOKEN, TESTFORGE_PROJECT,
// TESTFORGE_RUN_NAME. Missing config = the reporter no-ops (never fails a run).

import { TestForgeClient } from "./lib/client.js";

// Playwright status -> TestForge result status.
function mapStatus(status) {
  switch (status) {
    case "passed":
      return "PASSED";
    case "skipped":
      return "SKIPPED";
    case "failed":
    case "timedOut":
    case "interrupted":
      return "FAILED";
    default:
      return "FAILED";
  }
}

export default class TestForgeReporter {
  constructor(options = {}) {
    this.client = new TestForgeClient({
      url: options.url || process.env.TESTFORGE_URL,
      token: options.token || process.env.TESTFORGE_TOKEN,
      project: options.project || process.env.TESTFORGE_PROJECT,
    });
    this.runName =
      options.name ||
      process.env.TESTFORGE_RUN_NAME ||
      `Playwright ${new Date().toISOString()}`;
    this.enabled = this.client.configured;
    this.unmatched = 0;
    this.posted = 0;
  }

  printsToStdio() {
    return false;
  }

  async onBegin() {
    if (!this.enabled) {
      console.warn(
        "[testforge] not configured (need url, token, project) — skipping."
      );
      return;
    }
    try {
      await this.client.loadCaseMap();
      await this.client.createRun({
        name: this.runName,
        source: "PLAYWRIGHT",
        origin: process.env.CI ? "CI · Playwright" : "Local · Playwright",
      });
    } catch (e) {
      this.enabled = false;
      console.warn(`[testforge] could not start run: ${e.message}`);
    }
  }

  async onTestEnd(test, result) {
    if (!this.enabled) return;
    const name = [...test.titlePath()].join(" ");
    const caseId = this.client.resolveCaseId(name);
    if (!caseId) {
      this.unmatched++;
      return;
    }
    const message =
      result.errors?.map((e) => e.message).filter(Boolean).join("\n\n") ||
      result.error?.message ||
      undefined;
    try {
      await this.client.postResult({
        caseId,
        status: mapStatus(result.status),
        comment: message,
        elapsedSeconds: Math.round((result.duration ?? 0) / 1000),
      });
      this.posted++;
    } catch (e) {
      console.warn(`[testforge] result post failed: ${e.message}`);
    }
  }

  async onEnd() {
    if (!this.enabled) return;
    try {
      await this.client.completeRun();
      console.log(
        `[testforge] run completed — ${this.posted} result(s) posted` +
          (this.unmatched ? `, ${this.unmatched} test(s) without a TC-id` : "")
      );
    } catch (e) {
      console.warn(`[testforge] could not complete run: ${e.message}`);
    }
  }
}
