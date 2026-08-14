import type { Lesson, Track } from "../../types";
import { whatToAutomate } from "./what-to-automate";

// T3 — outlined in A-01, being written in A-08. The capstone is deliberately the
// real product loop: produce JUnit XML in CI and upload it to your sandbox
// project through /api/v1/junit. See docs/QA-ACADEMY.md §6.2.
//
// Lessons still to be written are `planned()` stubs: `draft`, empty body, no
// routes and no sitemap entries, so the roadmap renders the track as a "coming
// soon" card built from these titles (docs/QA-ACADEMY.md §4). A written lesson
// gets its own module next to this one, the same way T1 and T2 are laid out —
// and T2's rule applies here too: the track flips to `published` when every
// lesson is, not one at a time.
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

export const automation: Track = {
  slug: "automation",
  title: "QA Automation",
  tagline:
    "From your first script to a suite a team can maintain — and results that land back in TestForge.",
  level: "Mid → automation engineer",
  icon: "automation",
  status: "draft",
  outcomes: [
    "Decide what is worth automating, and say why the rest isn't",
    "Write Playwright tests with locators that survive a refactor",
    "Structure a suite that someone else can extend without asking you",
    "Run it in GitHub Actions on every pull request",
    "Publish results to TestForge and act on flakiness data",
  ],
  lessons: [
    whatToAutomate,
    planned("programming-foundations", "Programming foundations for testers", "Variables, functions, async, and reading someone else's code — JS/TS path.", 18),
    planned("first-playwright-test", "Your first Playwright test", "Install, record, run, and understand every line of what you just wrote.", 16, true),
    planned("locators", "Locators that survive a refactor", "Roles, labels and test ids — and why CSS chains break every sprint.", 14),
    planned("assertions-and-waiting", "Assertions and waiting", "Web-first assertions, auto-waiting, and why sleep() is a bug.", 13),
    planned("page-objects", "Page objects, and when they hurt", "Structure that pays off, structure that becomes a second application.", 14),
    planned("test-data", "Test data and fixtures", "Independent tests, seeded state, and cleaning up after yourself.", 13),
    planned("api-automation", "API automation", "Faster, steadier tests below the UI — and using the API to set up UI tests.", 14),
    planned("ci-github-actions", "Running in CI with GitHub Actions", "Workflows, matrices, artifacts, and keeping the pipeline under ten minutes.", 16, true),
    planned("junit-to-testforge", "Capstone: publish results to TestForge", "Emit JUnit XML, upload it via /api/v1/junit, and read the run you just created.", 15, true),
    planned("flaky-tests", "Flaky tests: diagnosis and quarantine", "Finding the cause, and muting honestly instead of retrying forever.", 14),
    planned("framework-design", "Designing a framework you can hand over", "Config, reporting, conventions, and the README that makes it survivable.", 15),
  ],
};
