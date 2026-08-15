import type { Lesson, Track } from "../../types";
import { performanceTesting } from "./performance-testing";
import { securityForTesters } from "./security-for-testers";

// T4 — outlined in A-01, being written in A-08. `beyond.ts` became this
// directory when the first lessons were written, matching T1, T2 and T3.
//
// Lessons still to be written are `planned()` stubs: `draft`, empty body, no
// routes and no sitemap entries, so the roadmap renders the track as a "coming
// soon" card built from these titles (docs/QA-ACADEMY.md §4). The rule T2 and T3
// both followed applies here too: the track flips to `published` when every
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

export const beyond: Track = {
  slug: "beyond",
  title: "Beyond Functional",
  tagline:
    "Performance, security, production, and the career conversation nobody teaches you.",
  level: "Mid → senior",
  icon: "trend",
  status: "draft",
  outcomes: [
    "Run a load test and interpret the numbers honestly",
    "Find the security problems a tester is well placed to find",
    "Use production signals as a testing input",
    "Judge where AI helps in QA and where it quietly lies",
    "Build a portfolio and interview like someone with judgement",
  ],
  lessons: [
    performanceTesting,
    securityForTesters,
    planned("contract-testing", "Contract testing", "Catching integration breakage without a full end-to-end environment.", 13),
    planned("testing-in-production", "Observability and testing in production", "Feature flags, canaries, synthetic checks, and reading your own logs.", 14),
    planned("ai-in-qa", "AI in QA: what it does well, where it lies", "Generating cases, reviewing requirements, and why a plausible test is dangerous.", 13),
    planned("portfolio", "Building a QA portfolio", "Publish a real project — suites, runs, results — that a hiring manager can open.", 12, true),
    planned("interview-prep", "Interview preparation", "The questions that always come, and how to answer with evidence.", 14),
  ],
};
