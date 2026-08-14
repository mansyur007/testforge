import type { Track } from "../../types";
import { accessibilityBasics } from "./accessibility-basics";
import { apiTesting } from "./api-testing";
import { crossBrowserMobile } from "./cross-browser-mobile";
import { exploratoryTesting } from "./exploratory-testing";
import { httpAndDevtools } from "./http-and-devtools";
import { metricsThatMeanSomething } from "./metrics-that-mean-something";
import { nonFunctionalBasics } from "./non-functional-basics";
import { reportingToStakeholders } from "./reporting-to-stakeholders";
import { riskBasedTesting } from "./risk-based-testing";
import { sqlForQa } from "./sql-for-qa";
import { testOracles } from "./test-oracles";
import { testPlanning } from "./test-planning";

// T2 — outlined in A-01, written across five A-08 slices and published at 12 of
// 12 (docs/QA-ACADEMY.md §A-08). The `planned()` stub helper that carried the
// unwritten lessons is gone with the last of them; one module per lesson, the
// same way T1 is laid out. The track flipped to `published` only when every
// lesson was, so nobody lands on a listing with dead entries in it.

export const manualPro: Track = {
  slug: "manual-pro",
  title: "Manual QA Professional",
  tagline:
    "Working under real constraints: planning, exploring, APIs, data, and reporting to people who don't read test cases.",
  level: "Junior → mid",
  icon: "manual",
  status: "published",
  outcomes: [
    "Write a test plan that fits on one page and survives contact with a deadline",
    "Rank work by risk and say out loud what you are not covering",
    "Run a chartered exploratory session and produce evidence from it",
    "Test an API directly, and verify results in the database",
    "Report status in terms a product owner acts on",
  ],
  lessons: [
    testPlanning,
    riskBasedTesting,
    exploratoryTesting,
    testOracles,
    httpAndDevtools,
    apiTesting,
    sqlForQa,
    crossBrowserMobile,
    accessibilityBasics,
    nonFunctionalBasics,
    metricsThatMeanSomething,
    reportingToStakeholders,
  ],
};
