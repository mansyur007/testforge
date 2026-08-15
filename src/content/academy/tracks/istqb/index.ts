import type { Track } from "../../types";
import { ch1Fundamentals } from "./ch1-fundamentals";
import { ch2Sdlc } from "./ch2-sdlc";
import { ch3StaticTesting } from "./ch3-static-testing";
import { ch4TestAnalysisDesign } from "./ch4-test-analysis-design";
import { ch5ManagingTestActivities } from "./ch5-managing-test-activities";
import { ch6TestTools } from "./ch6-test-tools";
import { examStrategy } from "./exam-strategy";

// T5 — outlined in A-01. The chapter lessons were written in A-08 over five
// slices; the question bank and the exam simulator are A-06. `istqb.ts` became
// this directory when the first chapter was written, matching T1–T4, and the
// `planned()` stub helper is now gone as it is from every other track.
//
// The §7 constraints this track publishes under (docs/QA-ACADEMY.md): original
// questions only, no ISTQB logo, no syllabus text reproduced, and the
// non-affiliation disclaimer on every page that names the scheme.
// `trademarkNotice` below is what the track and lesson pages render it on, and
// `scripts/academy-trademark-check.mjs` fails the build without it.

export const istqb: Track = {
  slug: "istqb",
  title: "Foundation Level Exam Prep",
  tagline:
    "Six chapters aligned to the CTFL v4.0 syllabus, chapter drills, and a full timed practice exam with a per-chapter score breakdown.",
  level: "Certification prep",
  icon: "target",
  status: "published",
  // §7.1: this track names the scheme on every one of its pages, so its track
  // and lesson pages carry the non-affiliation notice in the footer — the same
  // one the roadmap, the exam and the certificate already render.
  trademarkNotice: true,
  outcomes: [
    "Cover every syllabus chapter with its exam weighting in mind",
    "Drill one chapter at a time with explained answers",
    "Sit a timed 40-question practice exam under real conditions",
    "See which chapter is costing you the pass mark, and go back to it",
  ],
  lessons: [
    ch1Fundamentals,
    ch2Sdlc,
    ch3StaticTesting,
    ch4TestAnalysisDesign,
    ch5ManagingTestActivities,
    ch6TestTools,
    examStrategy,
  ],
};
