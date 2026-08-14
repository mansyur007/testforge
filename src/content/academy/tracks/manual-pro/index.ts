import type { Lesson, Track } from "../../types";
import { exploratoryTesting } from "./exploratory-testing";
import { riskBasedTesting } from "./risk-based-testing";
import { testOracles } from "./test-oracles";
import { testPlanning } from "./test-planning";

// T2 — outlined in A-01, being written in A-08. Lessons still to be written are
// `planned()` stubs: `draft`, empty body, no routes and no sitemap entries, so
// the roadmap renders the track as a "coming soon" card built from these titles
// (docs/QA-ACADEMY.md §4). A written lesson gets its own module next to this
// one, the same way T1 is laid out — the track flips to `published` when enough
// of them are, not one at a time, so nobody clicks into a track with one lesson
// in it.
const planned = (
  slug: string,
  title: string,
  summary: string,
  minutes: number,
  sandbox = false,
): Lesson => ({
  slug,
  title,
  summary,
  minutes,
  status: "draft",
  ...(sandbox ? { sandbox: true } : {}),
  body: "",
});

export const manualPro: Track = {
  slug: "manual-pro",
  title: "Manual QA Professional",
  tagline:
    "Working under real constraints: planning, exploring, APIs, data, and reporting to people who don't read test cases.",
  level: "Junior → mid",
  icon: "manual",
  status: "draft",
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
    planned("http-and-devtools", "HTTP and browser dev tools for testers", "Status codes, headers, the network tab, and reading a failed request like a developer.", 12),
    planned("api-testing", "API testing with Postman", "Requests, environments, chaining, assertions, and testing the API a UI hides.", 15, true),
    planned("sql-for-qa", "SQL for verification", "SELECT, JOIN and GROUP BY — enough to prove what the screen is claiming.", 14),
    planned("cross-browser-mobile", "Cross-browser and mobile testing", "Building a device matrix from analytics instead of superstition.", 11),
    planned("accessibility-basics", "Accessibility basics", "Keyboard, contrast, labels, screen readers — the checks that take ten minutes.", 12),
    planned("non-functional-basics", "Non-functional testing you can do today", "Cheap first checks for performance, security and reliability.", 12),
    planned("metrics-that-mean-something", "Metrics that mean something", "Pass-rate theatre, escape rate, and what to put on a dashboard.", 11, true),
    planned("reporting-to-stakeholders", "Reporting to stakeholders", "Turning results into a decision, in five sentences.", 10),
  ],
};
