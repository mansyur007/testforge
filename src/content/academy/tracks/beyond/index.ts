import type { Track } from "../../types";
import { aiInQa } from "./ai-in-qa";
import { contractTesting } from "./contract-testing";
import { interviewPrep } from "./interview-prep";
import { performanceTesting } from "./performance-testing";
import { portfolio } from "./portfolio";
import { securityForTesters } from "./security-for-testers";
import { testingInProduction } from "./testing-in-production";

// T4 — outlined in A-01, written in A-08 over four slices. `beyond.ts` became
// this directory when the first lessons were written, matching T1, T2 and T3.
//
// The `planned()` stub helper is gone, as T2's and T3's were: every lesson is
// written and `published`, so the track is too. §4's "coming soon" card
// rendering now applies to T5 alone.
export const beyond: Track = {
  slug: "beyond",
  title: "Beyond Functional",
  tagline:
    "Performance, security, production, and the career conversation nobody teaches you.",
  level: "Mid → senior",
  icon: "trend",
  status: "published",
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
    contractTesting,
    testingInProduction,
    aiInQa,
    portfolio,
    interviewPrep,
  ],
};
