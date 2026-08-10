import type { Lesson, Track } from "../types";

// T4 — outlined in A-01, written in A-08.
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
    planned("performance-testing", "Performance testing with k6", "Load, stress and soak — and what a p95 actually tells you.", 16),
    planned("security-for-testers", "Security testing for QA", "The OWASP Top 10 through a tester's eyes, with checks you can run today.", 16),
    planned("contract-testing", "Contract testing", "Catching integration breakage without a full end-to-end environment.", 13),
    planned("testing-in-production", "Observability and testing in production", "Feature flags, canaries, synthetic checks, and reading your own logs.", 14),
    planned("ai-in-qa", "AI in QA: what it does well, where it lies", "Generating cases, reviewing requirements, and why a plausible test is dangerous.", 13),
    planned("portfolio", "Building a QA portfolio", "Publish a real project — suites, runs, results — that a hiring manager can open.", 12, true),
    planned("interview-prep", "Interview preparation", "The questions that always come, and how to answer with evidence.", 14),
  ],
};
