import type { Track } from "../../types";
import { apiAutomation } from "./api-automation";
import { assertionsAndWaiting } from "./assertions-and-waiting";
import { ciGithubActions } from "./ci-github-actions";
import { firstPlaywrightTest } from "./first-playwright-test";
import { flakyTests } from "./flaky-tests";
import { frameworkDesign } from "./framework-design";
import { junitToTestforge } from "./junit-to-testforge";
import { locators } from "./locators";
import { pageObjects } from "./page-objects";
import { programmingFoundations } from "./programming-foundations";
import { testData } from "./test-data";
import { whatToAutomate } from "./what-to-automate";

// T3 — outlined in A-01, written across six A-08 slices and published at 12 of
// 12 (docs/QA-ACADEMY.md §A-08). The `planned()` stub helper that carried the
// unwritten lessons is gone with the last of them, the same way T2's did; one
// module per lesson. The track flipped to `published` only when every lesson
// was, so nobody lands on a listing with dead entries in it.
//
// The capstone is deliberately the real product loop: produce JUnit XML in CI
// and upload it to your sandbox project through /api/v1/junit. See §6.2.

export const automation: Track = {
  slug: "automation",
  title: "QA Automation",
  tagline:
    "From your first script to a suite a team can maintain — and results that land back in TestForge.",
  level: "Mid → automation engineer",
  icon: "automation",
  status: "published",
  outcomes: [
    "Decide what is worth automating, and say why the rest isn't",
    "Write Playwright tests with locators that survive a refactor",
    "Structure a suite that someone else can extend without asking you",
    "Run it in GitHub Actions on every pull request",
    "Publish results to TestForge and act on flakiness data",
  ],
  lessons: [
    whatToAutomate,
    programmingFoundations,
    firstPlaywrightTest,
    locators,
    assertionsAndWaiting,
    pageObjects,
    testData,
    apiAutomation,
    ciGithubActions,
    junitToTestforge,
    flakyTests,
    frameworkDesign,
  ],
};
