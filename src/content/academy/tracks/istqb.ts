import type { Lesson, Track } from "../types";

// T5 — outlined in A-01. The chapter lessons are written in A-08; the question
// bank and the exam simulator are A-06. Nothing here may be published until the
// trademark and originality constraints in docs/QA-ACADEMY.md §7 are satisfied:
// original questions only, no ISTQB logo, and the non-affiliation disclaimer on
// every page that names the scheme.
const planned = (
  slug: string,
  title: string,
  summary: string,
  minutes: number,
): Lesson => ({ slug, title, summary, minutes, status: "draft", body: "" });

export const istqb: Track = {
  slug: "istqb",
  title: "Foundation Level Exam Prep",
  tagline:
    "Six chapters aligned to the CTFL v4.0 syllabus, chapter drills, and a full timed practice exam with a per-chapter score breakdown.",
  level: "Certification prep",
  icon: "target",
  status: "draft",
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
    planned("ch1-fundamentals", "Chapter 1 — Fundamentals of testing", "What testing is, why it's needed, the seven principles, the test process, and the tester's mindset.", 25),
    planned("ch2-sdlc", "Chapter 2 — Testing throughout the SDLC", "Development models, test levels, test types, and maintenance testing.", 22),
    planned("ch3-static-testing", "Chapter 3 — Static testing", "Reviews, the review process, and what static analysis catches that execution can't.", 18),
    planned("ch4-test-analysis-design", "Chapter 4 — Test analysis and design", "Black-box, white-box and experience-based techniques, plus collaboration-based approaches.", 30),
    planned("ch5-managing-test-activities", "Chapter 5 — Managing the test activities", "Planning, risk, monitoring and control, configuration management, and defect management.", 28),
    planned("ch6-test-tools", "Chapter 6 — Test tools", "Tool support for testing, and the risks of adopting one.", 12),
    planned("exam-strategy", "Exam strategy", "Timing, K-levels, how the question styles work, and what to do with the last ten minutes.", 15),
  ],
};
