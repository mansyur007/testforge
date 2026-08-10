import type { Lesson, Track } from "../types";

// T2 — outlined in A-01, written in A-08. Every lesson is `draft`, so the track
// produces no routes and no sitemap entries; the roadmap renders it as a
// "coming soon" card built from these titles. See docs/QA-ACADEMY.md §4.
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
    planned("test-planning", "Test planning that fits on one page", "Scope, risks, environments, entry and exit criteria — without the 40-page template.", 14, true),
    planned("risk-based-testing", "Risk-based testing", "Impact × likelihood, and how to defend what you chose not to test.", 12),
    planned("exploratory-testing", "Exploratory and session-based testing", "Charters, timeboxes, note-taking, and why unscripted testing finds what scripts can't.", 14, true),
    planned("test-oracles", "Test oracles: how do you know it's wrong?", "Requirements, comparable products, history, and heuristics for when there is no spec.", 10),
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
