import type { Track } from "../../types";
import { whatQaDoes } from "./what-qa-does";
import { sdlcAndStlc } from "./sdlc-and-stlc";
import { testLevels } from "./test-levels";
import { testTypes } from "./test-types";
import { sevenPrinciples } from "./seven-principles";
import { equivalencePartitioning } from "./equivalence-partitioning";
import { boundaryValueAnalysis } from "./boundary-value-analysis";
import { decisionTables } from "./decision-tables";
import { stateTransitionTesting } from "./state-transition-testing";
import { writingTestCases } from "./writing-test-cases";
import { bugReports } from "./bug-reports";
import { defectLifecycle } from "./defect-lifecycle";
import { testingInAgile } from "./testing-in-agile";

// T1 — the only track published in A-01. Lesson order is this array: concepts
// first, then the four design techniques, then the two things a junior writes
// every day (cases, defect reports), then the sprint they live in.
export const fundamentals: Track = {
  slug: "fundamentals",
  title: "QA Fundamentals",
  tagline:
    "Everything you need to test a real feature and be trusted with the result.",
  level: "Zero → job-ready",
  icon: "checklist",
  status: "published",
  outcomes: [
    "Explain what testing can and cannot prove — without sounding defensive",
    "Turn a requirement into a defensible set of tests with four design techniques",
    "Write test cases another person can run and get the same verdict",
    "File defect reports that get fixed instead of closed as “cannot reproduce”",
    "Tell severity from priority, and know who decides which",
  ],
  lessons: [
    whatQaDoes,
    sdlcAndStlc,
    testLevels,
    testTypes,
    sevenPrinciples,
    equivalencePartitioning,
    boundaryValueAnalysis,
    decisionTables,
    stateTransitionTesting,
    writingTestCases,
    bugReports,
    defectLifecycle,
    testingInAgile,
  ],
};
