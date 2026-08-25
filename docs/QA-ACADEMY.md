# TestForge QA Academy — Feature Plan & Work Orders

> **Purpose.** Executable plan for **TestForge QA Academy**: a learning track that takes someone
> from zero to a hireable QA, on to QA automation, and through an ISTQB® Foundation Level practice
> exam — delivered *inside* TestForge, using the real product as the practice ground.
>
> **Status:** A-01 shipped 2026-08-10 (roadmap, track and lesson routes, Track 1 published);
> A-03 shipped 2026-08-11 (sitemap, `Course` markup, landing and app entry points);
> A-03b shipped 2026-08-11 (mobile entry points, beta labelling);
> A-02 shipped 2026-08-11 (39 self-check questions, anonymous progress, server-side grading);
> A-04a shipped 2026-08-11 (sandbox provisioning, ShopMini fixture, isolation);
> A-04b shipped 2026-08-11 (coach overlay, five sandbox-task checkers);
> A-05 shipped 2026-08-11 (persistence, claim-at-signup, `/academy/me`).
> A-06 shipped 2026-08-11 (exam engine, ISTQB question bank, practice exam + chapter quizzes).
> A-09 shipped 2026-08-12 (session-aware shell on /academy and /docs/help);
> A-09b shipped 2026-08-14 (the same shell one level deeper: track, lesson and help-topic pages,
> plus /academy/me and /academy/sandbox).
> A-10b shipped 2026-08-12 (single-use exam tickets);
> A-10a shipped 2026-08-12 (per-attempt choice shuffling, real-bank content guard);
> A-10c shipped 2026-08-12 (resumable attempts, bounded auto-submit).
> A-10d shipped 2026-08-13 over eight slices, taking the bank 70 → 255 questions: first slice landed
> 2026-08-12 (chapter 4 grown 12→36 questions, still short of
> its 55-question 5x target; 6 multi-answer questions added bank-wide, was 0; chapter 4's K-level mix
> shifted toward K3; syllabusRef spread widened to FL-4.1 and FL-4.5, previously uncovered), then
> corrected the same day — the new multi-answer questions had a learnable answer-set size, and the
> bank-check was structurally blind to it. Second slice 2026-08-12: chapter 5 completed 10→45, the
> first chapter to reach its 5× target since ch6, plus a build assertion against answers quoted in
> their own stems. Third slice 2026-08-12: chapter 4 completed 36→55, and the longest-answer tell
> measured for the first time — it scored 65.2% on whole papers, **above the 65% pass line**, so it
> was a working exploit. Fourth slice 2026-08-12: the length pass — 204 choice texts rewritten across
> all six chapters, taking that strategy to 31.4% and 0/300 papers passed, i.e. to chance; the guard
> is now a hard assertion rather than a ratchet. Fifth slice 2026-08-13: chapter 1 completed 12→40,
> the first chapter written after A-10e and therefore the first written against the *untested
> objective* list the build prints rather than against a chapter count — eight of its fourteen
> objectives had no question at all, and they took 21 of the 28 new ones. Sixth slice 2026-08-13:
> chapters 2 (12→30) and 3 (12→20), which **closes the pool debt** — the bank holds 202 questions,
> every chapter is at or above 5× its blueprint draw, and all 64 objectives are covered. Both of
> those stop being reported numbers and become build assertions in the same slice. Seventh slice
> 2026-08-13: chapters 4 (55→77) and 5 (45→63) to **7×** rather than 5×, which is the answer to the
> ≥300-question target — that number predated the blueprint weights and disagreed with the 5× rule
> beside it, so the multiplier now follows the draw instead of a round total. Eighth slice
> 2026-08-13: 13 questions across chapters 1, 2 and 3 put every one of the 64 objectives at **three
> questions or more**, asserted, which **closes A-10d** — depth per objective was the measure a
> chapter-level count could not see, and two objectives had sat at a single question through six
> slices because nothing was counting past zero.
> A-10e opened 2026-08-12 from an audit against the real CTFL v4.0.1 syllabus the owner supplied: 26
> questions citing objective codes that do not exist, 6 testing material ISTQB removed from
> Foundation in v4.0, and 58 whose K-level contradicts their objective — none of it detectable
> without the document. **Shipped 2026-08-13**: the 64 objectives are in the repo as data, 70 refs
> and 73 K-levels are corrected, the 6 unexaminable questions are rewritten, and three build
> assertions make the whole class of error unrepresentable. It also closes half of §5.1's "verify
> before seeding" warning. The owner then supplied the exam structure on 2026-08-13 — 40 questions,
> 65% pass, 60 minutes plus 15 in a non-native language, all of which `exams.ts` already matches — so
> what is still unverified is **the per-chapter split alone** (8 / 6 / 4 / 11 / 9 / 2).
> A-07 shipped 2026-08-13 (certificates for a completed track and a passing full paper: HMAC-derived
> serials, a public page with its own share card, and a holder-controlled switch on the link). It
> waited for A-10 on purpose — a shareable record of a paper that could be passed by always picking
> the first choice, on an attempt that could be forged, would have been a way to publish a false
> statement about somebody rather than a feature.
> A-08 in progress — content, landing in slices: first 2026-08-14 (T2's `test-planning`), second
> 2026-08-14 (T2 lessons 2–4), third 2026-08-14 (T2 lessons 5–7, the technical block), fourth
> 2026-08-14 (T2 lessons 8–10, the quality-attribute block), fifth 2026-08-14 (T2 lessons 11–12,
> **and the track published at 12 of 12** — the first A-08 slice with a visible change: thirteen
> routes, thirteen sitemap entries, a clickable roadmap card, and T1's long-dangling link to
> `/academy/manual-pro` finally resolving), sixth 2026-08-14 (T3's first lesson, `what-to-automate`,
> back to `draft` and invisible), seventh 2026-08-14 (T3's `programming-foundations`, 2 of 12),
> eighth 2026-08-14 (T3's `first-playwright-test` and `locators` as a pair, 4 of 12), ninth
> 2026-08-14 (T3's `assertions-and-waiting` and `page-objects`, 6 of 12 — halfway, still `draft`),
> tenth 2026-08-14 (T3's `test-data` and `api-automation` as a genuine pair, 8 of 12), eleventh
> 2026-08-15 (T3's `ci-github-actions` and the `junit-to-testforge` capstone, 10 of 12 — and a fix to
> four earlier lessons that taught a `TC-<n>` test-naming convention the real matcher rejects),
> twelfth 2026-08-15 (T3's `flaky-tests` and `framework-design`, **and the track published at 12 of
> 12** — the second A-08 slice with a visible change: thirteen routes, thirteen sitemap entries, a
> third clickable roadmap card, and T1's `test-levels` link to `/academy/automation` finally
> resolving after 404ing since A-01), thirteenth 2026-08-15 (T4 opens with `performance-testing` and
> `security-for-testers`, 2 of 7, back to `draft` and invisible), fourteenth 2026-08-15 (T4's
> `contract-testing` and `testing-in-production` — the before-deploy and after-deploy halves of one
> problem — 4 of 7, still `draft`), fifteenth 2026-08-15 (T4's `ai-in-qa` alone, 5 of 7, still
> `draft`), sixteenth 2026-08-15 (T4's `portfolio` and `interview-prep`, **and the track published at
> 7 of 7** — the third A-08 slice with a visible change: eight routes, eight sitemap entries, a
> fourth clickable roadmap card, and `framework-design`'s forward pointer to `/academy/beyond`
> becoming a link exactly as the twelfth slice predicted), seventeenth 2026-08-15 (T5 opens with
> `ch1-fundamentals`, 1 of 7, back to `draft` and invisible), eighteenth 2026-08-15 (T5's `ch2-sdlc`
> and `ch3-static-testing`, 3 of 7, still `draft`), nineteenth 2026-08-15 (T5's
> `ch4-test-analysis-design` alone — the K3 chapter, and the biggest lesson in the Academy — 4 of 7,
> still `draft`), twentieth 2026-08-15 (T5's `ch5-managing-test-activities` alone — 16 objectives,
> the most of any chapter — 5 of 7, still `draft`; the checker-debt tally was also recounted from
> source and corrected to eight), twenty-first 2026-08-15 (T5's `ch6-test-tools` and `exam-strategy`,
> **and the track published at 7 of 7** — the fourth A-08 slice with a visible change: eight routes,
> eight sitemap entries, the fifth roadmap card becoming a link, and **no "coming soon" card left on
> `/academy`**).
> **Status, 2026-08-15 — A-11 closed, and everything left is parked rather than pending.** Every
> work order above is shipped except two items, neither waiting on engineering time: A-08's
> localised `/id/academy/**` routes (unblocks on a measured ID organic-traffic number) and A-10's
> per-chapter blueprint split (unblocks on an ISTQB exam-structure document — owner action). The
> sandbox checker debt is closed: all 13 hands-on lessons render "Start this exercise", 11 have real
> checkers, 2 are explicitly self-assessed, and the build asserts it.
> **Status, 2026-08-18 — A-10 is fully closed, and one parked item is left.** The owner supplied
> ISTQB's *Exam Structure Tables* v1.18, whose "CTFL v4.0" page confirms the per-chapter split
> 8 / 6 / 4 / 11 / 9 / 2 exactly as authored. The item closed on the document rather than on the
> planned "call it an approximation" fallback, the split is now asserted against the document at
> build time, and the prose that hedged it is corrected. §5.1 has the account, including the
> per-chapter K-level breakdown the same page supplies and why the draw deliberately does not use it
> yet. **The only item still parked is A-08's localised `/id/academy/**` routes.**
>
> **Status, 2026-08-19 — A-08 is closed, and with it every work order in this document.** The owner
> lifted A-03's organic-traffic gate and asked for all 51 lessons in Indonesian; the routing half
> shipped 2026-08-18 (PR #223) and the translation landed one track per slice over five more. Every
> published lesson now has an Indonesian sibling, `/id/academy/**` resolves for all 57 routes,
> `hreflang` is reciprocal on every pair rather than on one, and the sitemap carries 57 Indonesian
> URLs against the English 57. Nothing in the Academy is parked.
>
> **Status, 2026-08-21 — A-08a, the loose end A-08 left between the two language systems.** Closing
> A-08 made the Academy's language a property of the path and left `tf_lang` governing the rest of
> the public site, with nothing joining them, so a reader's language reset on every crossing between
> the two — reported as *"di academy bahasa selalu berubah ke english"* (issue #226). Entry points
> now lead into the reader's language, an explicit switch is remembered, and reading an `/id` URL
> counts as a choice. Details in **A-08a** below.
>
> **A-08's content half is done: five tracks, 51 lessons, all `published`. The Indonesian routes are
> what remains** — gated by A-03 on measured ID organic traffic — **plus the sandbox checkers, which
> belong in their own work order.**
> Created 2026-08-10.
> Work orders are numbered `A-01 … A-11` (a new track alongside `F-xx`/`L-xx` in
> [`DOCUMENTATION.md` Part IV](DOCUMENTATION.md#part-iv--feature-work-orders), because Academy is a
> subsystem delivered over several PRs rather than one feature). Status legend: `[ ]` not started ·
> `[x]` shipped. **Part IV §0 (repo conventions) and §1 (Definition of Done) are normative here** —
> this document only records what is *specific* to Academy.
>
> When an `A-xx` ships: tick it here, and append its entry to Part IV §8 of `DOCUMENTATION.md` so
> the feature history stays in one place.

---

## Table of contents

- [1. The decision: where Academy lives and why](#1-the-decision-where-academy-lives-and-why)
- [2. Architecture](#2-architecture)
- [3. Data model](#3-data-model)
- [4. Curriculum](#4-curriculum)
- [5. The ISTQB Foundation practice exam](#5-the-istqb-foundation-practice-exam)
- [6. Learn-by-doing: the Academy sandbox](#6-learn-by-doing-the-academy-sandbox)
- [7. Legal & trademark constraints](#7-legal--trademark-constraints)
- [8. Work orders A-01 … A-11](#8-work-orders)
- [9. Risks, open questions, deliberate exclusions](#9-risks-open-questions-deliberate-exclusions)

---

## 1. The decision: where Academy lives and why

Four placements were considered. **Option C (hybrid) was chosen**, with the sandbox integration
included from the start rather than deferred.

| Option | Shape | Rejected because |
|---|---|---|
| A — public content only | Static pages next to `/docs/help`, quiz state in `localStorage` | No progress, no certificate, no exam history across devices. (Kept as **phase 1** — see below.) |
| B — in-app module only | Authed pages inside `(app)`, full Prisma model | The content would be invisible to crawlers. Academy's biggest single value is organic acquisition; a login wall throws it away. |
| **C — hybrid (chosen)** | Public, indexable content at `/academy/**`; progress + exam attempts persist to the DB when a session exists; anonymous progress is claimed at signup | — |
| D — separate package/subdomain | `packages/academy` or `academy.<host>` | Duplicates auth, design system, i18n and deploy for no gain today. Only worth it if Academy ever becomes a separately sold product. |

**Why hybrid is not just "both":** it makes the funnel a single continuous surface. A stranger
lands on `/academy/istqb/practice-exam` from search, takes the exam anonymously, sees a score
breakdown, and hits one prompt — *"Save this attempt and track your progress"* — which is a signup.
The same account then has a sandbox project, and the automation track's capstone is uploading a
real JUnit XML into it. Learning and the product are the same funnel, not two products sharing a
domain.

**Why the sandbox from day one:** the differentiator is not "a QA course exists" — dozens do. It is
that the lesson *"write a test case that uses boundary value analysis"* opens the real `CaseForm`
against a real project and then checks the work. TestRail and Qase have documentation; none of them
teach QA inside the tool. If the sandbox is deferred, the first release is a blog with quizzes and
the differentiator never gets tested with users. It is therefore in phase 1's critical path
(A-04), not a phase 4 bonus.

### Route map

| Path | Auth | Rendering |
|---|---|---|
| `/academy` | public | static — roadmap overview, all tracks |
| `/academy/[track]` | public | static — track landing, lesson list, progress bar if session |
| `/academy/[track]/[lesson]` | public | static shell + dynamic progress island |
| `/academy/istqb/practice-exam` | public | dynamic (server issues the question set) |
| `/academy/istqb/practice-exam/[attemptId]` | session **or** signed ticket | dynamic — result breakdown |
| `/academy/certificate/[serial]` | public | dynamic — shareable, `INDEXABLE` |
| `/academy/me` | session | dynamic — my progress, attempt history, certificates |

Not under `/docs` — `/docs` is product documentation for existing users; Academy is a
destination of its own and needs its own top-level nav entry. Landing nav (`src/app/page.tsx`)
gains **Academy**, footer gains it under a new "Learn" column, and `AppShell` gains an Academy item
so logged-in users can resume.

---

## 2. Architecture

### 2.1 Content lives in git, state lives in the DB

Lessons are **TypeScript modules under `src/content/academy/`**, mirroring `src/content/help`
exactly. This is not a style preference: per the comment at the top of `src/content/help/index.ts`,
the production Docker image ships only `.next/`, `node_modules/` and `prisma/` — markdown files
read from disk at request time would not exist in the container. TS modules get bundled.

Consequences, all of them wanted:

- Content is reviewed in PRs, versioned, and diffable.
- Self-hosters get the whole Academy with no seed step and no admin CMS to build.
- Adding a lesson is a code change, so a non-technical author cannot publish. Accepted — see
  §9 for the CMS question.

```
src/content/academy/
  index.ts            # TRACKS, getTrack(), getLesson(), lessonNeighbours()
  types.ts            # Track, Lesson, LessonBlock, SandboxTask
  tracks/
    fundamentals.ts   # T1
    manual-pro.ts     # T2
    automation.ts     # T3
    beyond.ts         # T4
    istqb.ts          # T5
  questions/
    index.ts          # QUESTION_BANK, byChapter(), draw(blueprint, seed)
    ch1-fundamentals.ts … ch6-tools.ts
```

### 2.2 Correct answers must never reach the browser

The question bank is a TS module, so it is trivially importable from a client component — and then
the answers are in the JS bundle. Two rules make that impossible by construction:

1. `src/content/academy/questions/**` is imported **only** from server components, server actions
   and route handlers. Enforced by an ESLint `no-restricted-imports` rule scoped to files with
   `"use client"`, plus a unit test asserting the built client chunks contain no `isCorrect`.
2. Everything crossing to the client goes through `sanitizeQuestion()` in
   `src/lib/academy/exam.ts`, which returns `{ id, stem, choices: [{id, text}], multi }` — no
   `isCorrect`, no `explanation`, no `chapter`/`kLevel` (they leak difficulty hints). Explanations
   are returned by the **grading** action, after submission.

Grading happens server-side in `submitAttempt()`. The client never computes a score.

### 2.3 The timer is server-authoritative

`ExamAttempt.startedAt` is written by the server. `submitAttempt()` rejects anything arriving after
`startedAt + durationSec + 30s` grace with a partial grade of what was answered, rather than
trusting a client clock or a `setTimeout` that a paused tab never fires.

### 2.4 Anonymous users need no DB rows

Phase 1 has no Academy tables at all, and even after A-05 an anonymous exam must not write rows
(otherwise every crawler and casual visitor mints garbage).

- **Lesson progress, anonymous:** `localStorage` key `tf_academy_progress` — `{ [lessonSlug]: ts }`.
- **Exam, anonymous:** on start the server returns the sanitized questions plus a **signed ticket**
  — HMAC-SHA256 (key derived from `AUTH_SECRET`, same pattern as `src/lib/crypto.ts`) over
  `{ questionIds, seed, startedAt, exp }`, base64url. Submission sends answers + ticket; the server
  verifies the HMAC, re-derives the same question set, and grades. No row, no forgery.
- **Claiming at signup:** `claimAcademyProgress()` server action, called once after the first
  authenticated page load, POSTs whatever is in `localStorage` (and the last exam ticket + answers)
  and writes real rows, then clears the key. Idempotent — re-running never duplicates.

### 2.5 Conventions this feature inherits

Server actions in `src/app/actions/academy.ts` following Part IV §0.2 (auth → RBAC → tenant guard →
validate → mutate → `logAudit` → `revalidatePath`); audit actions named `academy.lesson_complete`,
`academy.exam_submit`, `academy.certificate_issue`. No Prisma `enum`, no `Json` — `String` +
comment, `*Json` columns (§0.1). Public pages use `src/lib/i18n.ts` for chrome; SEO via `canonical`,
`INDEXABLE`, `techArticleLd`, `breadcrumbLd`, `ldGraph` from `src/lib/seo.ts`, plus a `Course` /
`Quiz` JSON-LD node added to `seo.ts`. New routes are added to `src/app/sitemap.ts`.

---

## 3. Data model

Added in A-05, not A-01 — phase 1 is deliberately DB-free.

```prisma
model LessonProgress {
  id          String   @id @default(cuid())
  userId      String
  trackSlug   String   // content lives in git; only the slug is persisted
  lessonSlug  String
  status      String   @default("DONE") // STARTED | DONE
  completedAt DateTime?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonSlug])
  @@index([userId, trackSlug])
}

// One row per attempt. Questions are NOT copied in; questionIdsJson + seed
// reproduce the exact paper from the git-versioned bank. If a question is later
// edited, old attempts still resolve — deleted ones degrade to "question
// withdrawn" in the review view rather than breaking the page.
model ExamAttempt {
  id             String    @id @default(cuid())
  userId         String
  templateSlug   String    // "ctfl-v4-full" | "ctfl-v4-ch4" | ...
  seed           String
  questionIdsJson String   @default("[]")
  answersJson    String    @default("{}") // { [questionId]: string[] }
  startedAt      DateTime  @default(now())
  submittedAt    DateTime?
  durationSec    Int
  score          Int       @default(0)  // correct answers
  total          Int
  passed         Boolean   @default(false)
  chapterScoresJson String @default("{}") // { "1": {correct, total}, ... }

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, templateSlug])
}

model Certificate {
  id        String   @id @default(cuid())
  userId    String
  kind      String   // TRACK | EXAM
  refSlug   String   // track slug or exam template slug
  serial    String   @unique // HMAC-derived, unguessable, public URL segment
  scorePct  Int?
  holderName String? // A-07c: frozen at issue; null = issued before the column
  issuedAt  DateTime @default(now())
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Plus, on existing models:

- `User` — back-relations `lessonProgress`, `examAttempts`, `certificates`.
- `Project` — `kind String @default("NORMAL") // NORMAL | ACADEMY_SANDBOX`. One defaulted column;
  it is what lets project lists, dashboards and org-wide counts exclude sandboxes without
  slug-prefix sniffing.

---

## 4. Curriculum

Five tracks, ~70 lessons. Each lesson: 5–15 minutes, an "in practice" section, a 3–5 question
self-check, and — where marked 🛠 — a sandbox task.

> **As shipped (2026-08-23, audit OBS-1).** The sketch below is the plan; the Academy that shipped
> is **51 published lessons** across the same five tracks — 13 · 12 · 12 · 7 · 7 — all of them
> translated to Indonesian. The one named topic that is *not* in it is **use-case testing** in T1,
> and its absence is deliberate rather than an omission: the v4.0 Release Notes removed use case
> testing from Foundation Level (it lives in Advanced Test Analyst now), and v4.0 is the syllabus
> T5 and the 255-question bank are built against — A-10e deleted three bank questions over exactly
> this, and it would be odd to keep teaching in T1 what the bank was corrected for asking.
> Everything else in the sketch shipped. The ~70 figure was an estimate made before any lesson was
> written rather than a target that was missed — the published lessons run longer than the plan
> assumed. Treat the list below as the *shape* of the curriculum, and
> `src/content/academy/tracks/**` as its contents.

**T1 — QA Fundamentals** *(zero → able to apply)*
SDLC & STLC · what a tester actually does day to day · test levels (unit/integration/system/UAT) ·
test types (functional, non-functional, regression, smoke) · the 7 testing principles · test design
techniques: equivalence partitioning 🛠, boundary value analysis 🛠, decision tables 🛠, state
transition, use-case testing · anatomy of a good test case 🛠 · writing a bug report that gets
fixed 🛠 · defect lifecycle & severity vs priority · testing in Agile, the tester in a sprint.

**T2 — Manual QA Professional** *(junior → mid)*
Test planning & strategy 🛠 (build a real test plan) · risk-based testing and what to cut when time
runs out · exploratory & session-based testing 🛠 · charters and note-taking · API testing with
Postman/Insomnia · reading and writing SQL for verification · HTTP, status codes, dev-tools for
testers · cross-browser & mobile testing · accessibility basics · non-functional testing overview ·
test metrics that mean something (and pass-rate theatre) 🛠 · reporting to stakeholders.

**T3 — QA Automation** *(mid → automation engineer)*
Should this be automated? the pyramid and its critics · programming foundations (JS/TS path,
Python path) · locators & selector strategy that survives refactors · first Playwright test 🛠 ·
assertions, waits, and why `sleep` is a bug · Page Object Model and when it hurts · data-driven
tests & fixtures · API automation · running in CI with GitHub Actions · **capstone:** produce JUnit
XML and upload it to your sandbox project via `/api/v1/junit` 🛠 · flaky tests: diagnosis and
quarantine · designing a framework you can hand over.

**T4 — Beyond** *(senior)*
Performance testing with k6/JMeter · security testing basics for QA (OWASP Top 10 through a
tester's eyes) · contract testing · observability & testing in production · AI in QA: what it does
well and where it lies · career paths, CV, portfolio 🛠 (publish your sandbox project via
portfolio mode, F-38), interview prep.

**T5 — ISTQB Foundation Level** *(certification)*
Six chapters mapped to the CTFL v4.0 syllabus structure, each with a chapter quiz weighted like the
real paper, then the full practice exam. See §5.

Every lesson and track carries `status: "draft" | "published"`. A draft **has no route at all** — a
half-written track can be merged and 404s in production.

> **Mechanism changed during A-09b (2026-08-14).** This used to say drafts are excluded from
> `generateStaticParams` and, with `dynamicParams = false`, get no route. Those two are gone — they
> cannot coexist with the `force-dynamic` that reading the session cookie forces. The guarantee is
> unchanged and was never theirs to begin with: `getTrack()` and `getLesson()` filter to published
> and return undefined, and the pages call `notFound()`. The 404 is now decided per request rather
> than against a build-time list.

> **Changed during A-01.** This originally read "drafts render only with `?preview=1`". A page that
> reads `searchParams` opts the whole route out of static rendering, which would have cost every
> Academy page its prerender — the opposite of A-01's acceptance criterion. Previewing a draft is
> therefore a branch deploy (flip the status, push the branch), not a query parameter. Draft
> *tracks* still appear on the roadmap as non-clickable "coming soon" cards built from their lesson
> titles, so the roadmap stays honest without exposing empty pages.

---

## 5. The ISTQB Foundation practice exam

### 5.1 Blueprint

Modelled on the CTFL v4.0 exam structure: **40 questions, 60 minutes** (75 for non-native English
speakers — offered as a checkbox at start), **pass at 65% = 26/40**, points distributed by chapter:

| Ch | Topic | Questions | K1 | K2 | K3 |
|---:|---|---:|---:|---:|---:|
| 1 | Fundamentals of Testing | 8 | 2 | 6 | 0 |
| 2 | Testing Throughout the SDLC | 6 | 2 | 4 | 0 |
| 3 | Static Testing | 4 | 2 | 2 | 0 |
| 4 | Test Analysis and Design | 11 | 0 | 6 | 5 |
| 5 | Managing the Test Activities | 9 | 1 | 5 | 3 |
| 6 | Test Tools | 2 | 1 | 1 | 0 |
| | **Total** | **40** | **8** | **24** | **8** |

> **Closed 2026-08-18. The weights are the published ones, and the build now checks that.**
> ISTQB's *Exam Structure Tables* v1.18 (2026-05-27) is in hand, and its "CTFL v4.0" page settles
> the last open number in A-10 — the per-chapter split. **8 / 6 / 4 / 11 / 9 / 2 was already
> exactly right.** So was every other figure: 40 questions, pass at 26 of 40, 60 minutes, and 75
> minutes total under the non-native-language allowance. The K-level columns in the table above are
> new information from the same page.
>
> **The right conclusion is not "we were right, so the process was fine".** The split was authored
> from memory of the syllabus — the same process that produced the 70 `syllabusRef` tags and 73
> K-levels A-10e had to correct. It came out right; it could as easily not have. What changed is
> that the number is now *checked* rather than *trusted*, and the check is a build assertion rather
> than a paragraph:
>
> - `scripts/academy-bank-check.mjs` holds `PUBLISHED_CTFL_V4` — the document's numbers, transcribed
>   as numbers — and parses `CTFL_V4_FULL` out of `src/content/academy/exams.ts` to compare against
>   it. A weight edited in `exams.ts` alone fails `npm run build`. Verified by breaking chapter 3 to
>   5 and watching the build fail with both splits printed, then restoring it.
> - The checker's own `FULL_EXAM_CHAPTERS` used to be a **second hand-typed copy** of the split. It
>   is now derived from `exams.ts`, so the simulations run against what the app ships. Two copies of
>   a number that must agree is the drift A-11a's tally lesson warned about, and it was sitting in
>   the file that exists to catch drift.
>
> **What the document does not change.** The bank, the questions, the chapter quizzes and the
> 8-question quiz size are all still TestForge's own, and §7.1 still governs how this is described:
> the structure is published, the paper is ours, and neither the start screen nor the result page
> claims to *be* the ISTQB exam. Only the prose that called the split "our approximation" was wrong,
> and it is corrected — in `exam-strategy`, on the exam start screen, and here.
>
> **Recorded and deliberately not implemented: the K-level split.** The document gives a per-chapter
> K1/K2/K3 breakdown (8 / 24 / 8 overall), and `drawQuestionIds` is chapter-weighted only, so our
> paper matches the chapter counts but does not guarantee that exactly five of chapter 4's eleven
> are K3. **Making the draw honour K-levels would change which questions a stored `seed`
> re-derives**, and re-deriving a paper from its seed is what makes a past attempt reproducible and
> a certificate checkable (§2.3, A-10b). That is a migration, not a tweak, and it belongs in its own
> work order with a decision about existing attempts. `PUBLISHED_CTFL_V4.k` records the numbers and
> asserts only that they total each chapter's count; `exam-strategy` tells the learner plainly that
> our draw matches the counts and not the K columns.

Bank target, as settled by A-10d's seventh and eighth slices: **≥7× the number drawn per chapter for
chapters 4 and 5, ≥5× for the rest, and ≥3 questions per learning objective.** All three are
assertions in `academy-bank-check.mjs`, and together they put the bank at 255. *This replaces the
"≥300 questions" this line used to carry* — that was a round number written before the blueprint
weights were known, and it disagreed with the 5× rule beside it (5× yields 200). Reaching 300
uniformly would have meant padding chapter 6, which has two learning objectives and cannot spread
past them; the multiplier follows the draw instead. Each question is tagged `chapter`, `kLevel`
(K1/K2/K3), `syllabusRef` (e.g. `FL-4.2.1`), with a written explanation and, where the answer is a
technique, a worked example.

`draw(blueprint, seed)` is a deterministic seeded shuffle: same seed → same paper (needed to
reproduce an attempt from `seed` alone), different seeds → different papers, and no question
repeats within a paper.

### 5.2 Exam UX

Start screen (rules, timer length, extra-time checkbox) → one question per screen with a question
navigator grid → **flag for review** → warning at 10 and 2 minutes → confirm-submit listing
unanswered and flagged counts → auto-submit at zero.

Result screen: pass/fail against 26/40, total score, **per-chapter breakdown with a bar per
chapter** (this is the actionable part — "you failed on chapter 4, go back to test design"),
full review of every question with the chosen answer, correct answer, explanation and a deep link
back to the lesson that covers it. Attempt history at `/academy/me` with a score-over-time
sparkline.

Also shipped: six **chapter quizzes** (10 questions, untimed) reusing the same engine with a
single-chapter blueprint, so learners can drill before the full paper.

---

## 6. Learn-by-doing: the Academy sandbox

### 6.1 Provisioning

On the first 🛠 lesson (or the "Start practising" button on `/academy`), `ensureSandbox()` lazily
creates one project per user: `name: "Academy Sandbox"`, `slug: academy-<8-char-suffix>`,
`kind: "ACADEMY_SANDBOX"`, creator = the user, one `ProjectMember` row (role `ADMIN` so every
lesson can exercise every permission), seeded with a fixture: a fake product — **"ShopMini"**, a
small e-commerce app with a written requirements page — plus a suite tree (Auth, Cart, Checkout,
Search) and three reference test cases showing the target quality. The fixture lives in
`src/content/academy/sandbox.ts` and is applied by `seedSandbox(projectId)` in
`src/lib/academy/sandbox.ts`; `prisma/seed.mjs` is untouched.

Sandboxes are excluded from the project list count, org dashboards and superadmin metrics by
`kind: "NORMAL"` filters, and are shown in a separate "Academy" section of the project switcher.
"Reset sandbox" wipes and re-seeds. Deleting it is allowed; the next 🛠 lesson re-creates it.

### 6.2 Coach overlay + verification

A sandbox lesson deep-links into the real app route with `?academy=<lessonSlug>`, e.g.
`/projects/academy-x1y2/cases/new?academy=bva-basics`. `AcademyCoach` (a client component mounted
once in `src/app/(app)/layout.tsx`, rendering `null` unless the param is present) shows a dockable
panel: the task, the acceptance criteria in plain language, a hint disclosure, **Check my work**,
and Back to lesson.

**Check my work** calls `verifyTask(lessonSlug)` — a server action that runs the task's checker
against real DB rows. Checkers are pure functions in `src/lib/academy/checks.ts`, e.g. for
`bva-basics`: a case exists in the Checkout suite, created after the attempt started, whose
`stepsJson` has ≥3 steps, whose title or steps reference at least three of the boundary values
implied by the fixture's stated rule (`quantity 1..99`), and whose `expectedResult` is non-empty.
Each checker returns `{ passed, feedback[] }` — feedback is specific ("you covered 0, 1 and 100 but
not 99 — the upper valid boundary is the one most likely to be broken"), never just "wrong".

Checkers must be forgiving about wording and strict about structure. A checker that demands an
exact string turns a lesson into a guessing game; that is the main design risk of this feature and
the reason each checker ships with unit tests over a handful of good and bad submissions.

The capstone in T3 is verified differently: it passes when a `TestRun` created via
`/api/v1/junit` exists in the sandbox with ≥1 result — i.e. the learner really did wire a CI
upload.

---

## 7. Legal & trademark constraints

Non-negotiable, and cheaper to get right up front than to retrofit:

> **Gap found and closed 2026-08-14, before T5's content was written.** A-06 put the notice on
> every page that named the scheme *at the time* — the roadmap, both exam routes and the certificate
> — and stopped there. `/academy/[track]` and `/academy/[track]/[lesson]` never rendered it, which
> was invisible only because T5 is a draft and both routes 404 for it. The day its lessons published,
> a track page and six lesson pages naming ISTQB throughout would have gone live without the notice.
> Now: `Track.trademarkNotice` is a field, the two pages render `<TrademarkNotice />` on it, and
> `scripts/academy-trademark-check.mjs` (wired into `prebuild`) fails the build on any track whose
> source names ISTQB or CTFL without setting it. Verified by temporarily publishing T5: the notice
> renders on its track and lesson pages and on neither of T2's.

1. **ISTQB® is a registered trademark.** Every page mentioning it carries, in the footer:
   *"ISTQB® is a registered trademark of the International Software Testing Qualifications Board.
   TestForge QA Academy is not affiliated with, endorsed by, or accredited by the ISTQB or any of
   its member boards."* No ISTQB logo, ever. Naming is **"Foundation Level Practice Exam (aligned
   to the CTFL v4.0 syllabus)"** — never "ISTQB exam", never "official".
2. **Every question must be original.** No question may be copied or lightly reworded from a real
   exam paper, a published sample paper, or a commercial question bank. Questions are written from
   the syllabus's learning objectives. Each question's `syllabusRef` exists so a reviewer can check
   it teaches the objective rather than reproducing someone's material. This is stated in
   `CONTRIBUTING`-style terms at the top of `questions/index.ts`.
3. **Do not reproduce syllabus text.** Cite the objective, write the explanation in our own words.
4. **Certificates say what they are.** The certificate page reads "TestForge QA Academy — Track
   Completion", shows the score, and states explicitly that it is not a professional
   certification and confers no ISTQB credential.

---

## 8. Work orders

One `A-xx` per branch/PR per Part IV §0.6. Phases 1–2 are the shippable milestone; A-05 onward can
follow independently.

### A-01 — Academy shell, roadmap, and Track 1 content `[x]`

> **Status: DONE** (2026-08-10, branch `feat/academy-shell`).

**Delivered:** `/academy` (roadmap: five tracks, level ladder, lesson counts, time estimates),
`/academy/[track]`, `/academy/[track]/[lesson]` — all public, all prerendered, built on the shape of
`src/app/docs/help/[topic]/page.tsx` including its sidebar and `Markdown` rendering. Content system
(`src/content/academy/{types,index}.ts`, `tracks/**`) with **T1 written and published — 13 lessons,
2h 15m**, five of them carrying a hands-on marker. T2–T5 are outlined as draft tracks so the
roadmap shows the whole route without exposing empty pages. Prev/next lesson footer, lesson rail,
breadcrumb + `TechArticle` JSON-LD, per-lesson meta descriptions.

**Files:** `src/app/academy/**`, `src/content/academy/**`, `src/components/AcademyNav.tsx`,
`e2e/academy.spec.ts`.

**Verified:** `next build` prerenders `/academy` (○ static) and both dynamic segments as ● SSG with
all 13 lesson paths listed; nothing under `src/app/academy/**` imports `@/lib/db`.
`e2e/academy.spec.ts` — **TC-E2E-88** (roadmap: the published track is a link, a draft track is not
and says "In progress", and the §7 disclaimer is present), **TC-E2E-89** (track → first lesson,
markdown really rendered, next/prev walk and the first lesson has no "Previous"), **TC-E2E-90**
(hands-on callout present only on hands-on lessons; draft track and unknown lesson both 404),
**TC-E2E-91** (no horizontal overflow at 375px on all three route shapes). All four pass.

**Two deviations from the plan as written, both deliberate:**

1. **No `?preview=1`** — see the note in §4. Reading `searchParams` would have made every Academy
   route dynamic; drafts are excluded at build (`dynamicParams = false`) and previewed on a branch
   deploy instead.
2. **`AcademyProgressBar.tsx` not built.** It was listed in this work order, but there is nothing to
   show until A-02 stores quiz state and A-05 stores progress. A progress bar wired to a constant
   zero is dead code that has to be reworked anyway; it lands with the data.

**One thing found while building it.** T1's decision-table lesson has a nine-column markdown table
that pushed the document 53px sideways at 375px — caught by TC-E2E-91, not by eye. Fixed with
`max-md:` overrides on the lesson's `<Markdown>` (each table becomes its own scroll box below `md`,
native display and semantics from `md` up), scoped to the lesson page rather than to `.tf-markdown`
in `globals.css`, which also renders case descriptions and comments. Author-written markdown is now
a source of layout risk in this repo; TC-E2E-91 is the guard.

### A-02 — Self-check quizzes (client-side, anonymous) `[x]`

> **Status: DONE** (2026-08-11, branch `feat/academy-self-check`).

**Delivered:** **39 questions across all 13 T1 lessons** (3 each, single- and multi-answer), an
in-lesson quiz with immediate per-question feedback and explanations, retry, a "Mark as done"
toggle, and a per-track progress bar. Anonymous progress in `localStorage`
(`tf_academy_progress`), in the flat `slug → ISO timestamp` shape A-05's claim will post.

**The answer-key boundary, which is the actual work here:**

- `src/content/academy/index.ts` and `src/lib/academy/questions.ts` are **`server-only`**. An
  accidental client import is a *build error*. This replaces the ESLint `no-restricted-imports`
  rule this work order originally specified — that rule cannot be written, because ESLint matches
  files by path and Next has no filename convention for `"use client"`.
- Client-safe types live in their own module (`src/lib/academy/types.ts`) so no client component
  ever needs to import from the server-only one, not even for a type. A type-only import is erased
  before bundling, but "safe because the compiler removes it" is a property a future edit can
  falsify by deleting one keyword.
- `sanitizeQuestions()` runs in the lesson's **server** component; the client receives
  `{ id, stem, choices: [{id, text}], multi }` and nothing else. Explanations exist only in a
  grading response.
- Grading is the server action `gradeSelfCheck` — the path A-06's exam reuses. It deliberately
  breaks Part IV §0.2: no `requireSession` (Academy is readable without an account), no RBAC or
  tenant guard (it touches no tenant data), no `logAudit` (a stranger answering a quiz is traffic,
  not a change to a project). It does rate-limit per client IP, because it is a public endpoint
  that reads the answer key.

**Verified.** `scripts/academy-bundle-check.mjs` runs as `postbuild`, so `npm run build` covers it
with no CI change: it extracts every `explanation:` string from the lesson sources and greps the
built client chunks for the first 40 characters — *"academy-bundle-check: OK (39 explanations, 103
client chunks, 0 leaks)"*. Explanations are the canary rather than the `correct` flags because a
boolean minifies to `!0` and is indistinguishable from any other boolean; a sentence of English is
not. **The guard was proved to fail**: pasting one explanation into a built chunk makes it exit 1
naming the chunk and the source file.

**TC-E2E-96** (answer everything wrong → 0/3 with explanations and the lesson *not* marked done;
retry clears them; answer right → 3/3, lesson marked done, survives a reload, and the track page
reads "1 of 13 lessons done") and **TC-E2E-97** (the served document — HTML *and* the inline RSC
payload — contains the question stems but none of the explanation text, no `correctChoiceIds`, no
`"correct":true`).

**Judgement calls worth knowing:** a perfect score marks the lesson done and anything less does
not — the quiz is the check — but the manual toggle is always there for a learner who disagrees.
Multi-answer questions are graded on **set equality**, so selecting everything is not a pass.

### A-03 — SEO, i18n chrome, landing & app navigation `[x]`

> **Status: DONE** (2026-08-11, branch `feat/academy-seo-nav`). A-01 shipped the routes with no
> inbound link from anywhere; this is what makes them reachable.

**Delivered:** `/academy`, every published track and every published lesson in `src/app/sitemap.ts`
(drafts excluded — they have no route, so listing them would put 404s in the sitemap); `courseLd()`
in `src/lib/seo.ts`, emitted on track pages; **Academy** in the landing header nav and the footer's
Product column (both via `src/lib/i18n.ts`, en/id), and in the app sidebar next to Help.

**Verified:** TC-E2E-92 (landing nav link navigates; sitemap contains the roadmap, the track and a
lesson URL but *not* the draft track; the track page's `Course` node carries
`isAccessibleForFree` and a `courseWorkload` matching the real lesson minutes) and **TC-E2E-93**
(app sidebar link). Regression: TC-E2E-27 and TC-E2E-83…87 re-run green — the landing header gained
a fifth nav item, and TC-E2E-83/85 are what guard that at 375px and 1280px.

**Three deviations from the plan as written:**

1. **No `Quiz` JSON-LD.** There are no quizzes until A-02. A helper nothing calls is dead code —
   same reasoning that deferred `AcademyProgressBar` in A-01. It lands with the quizzes.
2. **No new footer column.** The footer grid is `md:grid-cols-4` and was designed as four; a fifth
   column for one link means re-balancing the whole footer. Academy sits in **Product**, which is
   also where it belongs — it is part of the product, not a separate publication.
3. **Academy page chrome is English-only.** Only the *entry points* (landing nav, footer) are
   translated, because the landing page around them is fully translated and an untranslated label
   there would stand out. The Academy pages themselves stay English: the lessons are English, and
   Indonesian buttons wrapped around English lesson bodies is a worse experience than consistent
   English. Locale-keyed lesson bodies were also dropped from this work order — introducing the
   `{ en, id? }` shape across 13 lesson files while there is not one line of Indonesian content is
   churn, and it costs exactly the same to do later. Both land together in A-08, with the localised
   routes that make them worth having.

**Known limit, deliberately deferred to A-08:** language is a cookie (`tf_lang`), so a single URL
serves both languages and Google will only ever index the English text. Indonesian SEO needs
`/id/academy/**` paths plus `hreflang`, which changes routing for the whole public site — its own
change, not a rider on this one.

### A-03b — Mobile entry points and beta labelling `[x]`

> **Status: DONE** (2026-08-11, branch `feat/academy-beta-entry-points`). Added after A-03 shipped,
> from one observation: **the landing header nav is `hidden md:flex` and the landing has no
> hamburger**, so on a phone A-03's header link rendered to nothing. A mobile visitor's only route
> to Academy was the footer, at the bottom of an 8,600px page.

**Delivered:**

- **Hero link** on the landing (`hero-academy-link`) — at y≈476 on a 375px viewport, the first
  mention a phone user meets, versus y≈2624 for the section.
- **Landing section** `#academy` between Features and Comparison: five track cards built **from
  `src/content/academy`**, not retyped, so the section cannot drift from what `/academy` offers —
  lesson counts and the published/draft split are read from the same module the routes use. Sixth
  grid cell is the CTA plus the beta note. Chrome strings en/id; track titles stay English, per
  the A-03 decision.
- **`BetaChip`** (`src/components/BetaChip.tsx`) on every Academy entry point — header nav, footer,
  hero link, landing section, app sidebar (`tone="dark"`) — and next to the `/academy` heading,
  plus a **banner** on `/academy` stating that one track is finished, the rest are being written,
  published lessons may still change, and where to report problems.
- **Help center** now points at Academy ("learning to test rather than learning the tool").

**Verified:** TC-E2E-94 (at 375px the header nav is hidden, the section renders five track headings
and its CTA, and the hero link navigates) and **TC-E2E-95** (four beta chips on the landing, banner
on `/academy`, chip in the app sidebar). Regression: TC-E2E-27, 83–87, 1–4 and the nine theme tests
all green — TC-83 covers `/` at 375px, which is the guard for the new section's layout.

**Note.** `GITHUB_REPO` is now declared a fourth time (here, `page.tsx`, `docs/self-hosting`,
`lib/seo.ts`). Hoisting it into one exported constant is the right fix and is a change to three
files this work order has no business touching — left as a deliberate follow-up.

### A-04 — Academy sandbox + coach overlay

**Split into two PRs.** The original work order bundled provisioning with the coach overlay and
five checkers. The checkers are called out in §9 as the sharpest product risk in this project, and
they deserve a review that is about them rather than one that also has to weigh a schema migration
and four query-filter changes. A-04a is the foundation; A-04b is the part that grades people's work.

#### A-04a — Sandbox provisioning, fixture and isolation `[x]`

> **Status: DONE** (2026-08-11, branch `feat/academy-sandbox`). First Academy schema change.

**Delivered:** `Project.kind` (`NORMAL | ACADEMY_SANDBOX`, defaulted, no migration file — the repo
uses `prisma db push`); `ensureSandbox()` / `seedSandbox()` / `resetSandbox()` in
`src/lib/academy/sandbox.ts`; the **ShopMini fixture** in `src/content/academy/sandbox.ts` (four
suites, three reference cases, and the requirements the T1 exercises are written against);
`/academy/sandbox` as the sandbox's home (create, open, reset); the sandbox under Academy in the
sidebar; hands-on lesson callouts now link to it instead of apologising for it.

**Isolation — the reason the column exists.** A sandbox is a *real* project (same tables, same
permissions, so a lesson can open the real `CaseForm`), which means it would otherwise show up as
the learner's work. `NOT_SANDBOX` now filters:

| Surface | Why |
|---|---|
| Dashboard (`mine`) | Practice cases would inflate Active Projects, Total Test Cases and the pass-rate KPI |
| `/projects` table | It is scratch space, not a project they own work in |
| Sidebar project list | Same, and it has its own entry under Academy |
| Global search | The fixture uses the same vocabulary (checkout, cart, login) as real projects and would top every result |

Search is filtered **only when unscoped**: `?project=<sandbox-slug>` still searches it, which is
what a learner hunting for their own practice case actually does.

**Judgement calls.** The slug is derived from the user id (`academy-<8>`), not random, so a learner
who deletes their sandbox and starts a hands-on lesson again lands on the same URL and any link a
lesson printed for them still works; a collision loop covers the case where someone names a normal
project the same thing. Reset **keeps the project and replaces its contents** rather than deleting
and recreating — "give me the starting position back" is not "give me a different project". The
learner is `OWNER` of their sandbox, so lessons can exercise every permission the product has.

**Verified:** TC-E2E-98 (created on demand, seeded with four suites and the reference cases,
absent from `/projects`, and the dashboard's Active Projects count unchanged before and after
creating one) and **TC-E2E-99** (reset is two-step, and the fixture case appears **exactly once**
afterwards — re-seeding on top of the old rows instead of replacing them is the failure mode worth
guarding). Regression: search and project-hub specs green.

#### A-04b — Coach overlay and checkers `[x]`

> **Status: DONE** (2026-08-11, branch `feat/academy-coach`).

**Delivered:** `AcademyCoach` (`src/components/AcademyCoach.tsx`), mounted once in
`src/app/(app)/layout.tsx`, reading `?academy=<lessonSlug>`; a "Start this exercise" button on
each of the five sandbox-marked T1 lessons (`openSandboxTask` in `src/app/actions/academy.ts`),
which creates the sandbox on first use and lands the learner on the real form — `cases/new`
pre-scoped to the right suite, or `defects` for the one non-case task — with the coach docked;
`verifyTask()` and the first five checkers (test case anatomy, BVA, EP, decision table, bug
report); a hint disclosure; **Check my work**; **Mark done anyway**, always available.

**Where the task metadata lives.** `SANDBOX_TASKS` in `src/content/academy/sandbox.ts` — task
text, acceptance criteria, hint, and which suite (or "defect") the exercise targets — keyed by
lesson slug, the same key `?academy=` carries. Deliberately not folded into the `Lesson` type in
`src/content/academy/types.ts`: that module is `server-only` (A-02's answer-key boundary), and
`AcademyCoach` is a client component that needs this data directly rather than round-tripping
through a server action to render a heading. Nothing in it is secret — it's the same thing each
lesson's body already says in prose.

**Checkers are pure functions, and that is what makes them testable.** `src/lib/academy/
checks-core.mjs` is plain ESM — the same pattern `src/lib/backup-core.mjs` already established in
this repo for logic that needs to run both inside the typed app and under bare `node` — taking
plain `{ title, stepsJson, expectedResult, … }` objects and returning `{ passed, feedback[] }`,
never touching a database. `src/lib/academy/checks.ts` is the thin, `server-only` typed wrapper
that fetches real rows from the learner's sandbox (scoped by suite and by `createdAt >= since`)
and hands them to the matching function. This is what makes `scripts/academy-checks-selftest.mjs`
possible — the unit tests §9 asks for run in milliseconds, no test database, wired into `prebuild`
next to `totp-selftest.mjs` and `backup-selfcheck.mjs` so `npm run build` covers it with no CI
change.

**Staying docked across a redirect is the actual engineering problem here, not the panel.** A
lesson's exercise link lands on `/projects/<sandbox>/cases/new?academy=<slug>`, but `createCase`
redirects to the new case's own detail page on save, dropping the query string — a coach that
vanished the instant the learner hit Save would be useless for the one action that matters. The
active lesson is mirrored into `sessionStorage` (`tf_academy_active`, alongside when the attempt
started) and the panel stays docked for as long as the learner is anywhere under their sandbox
project, not just the exact URL the query param first arrived on, until "Back to lesson" or leaving
the sandbox. Filing a defect doesn't have this problem — `createDefect` revalidates in place rather
than redirecting — so that path is covered by the plain `?academy=` param on its own; the e2e
exercises both branches.

**The attempt clock.** `since` (when the coach panel was opened for this lesson) stands in for
docs §2.3's exam-timer idea, applied here: a checker only counts rows created after the learner
opened the exercise, so the seeded reference cases (excluded again by exact title, belt-and-braces)
and leftovers from an earlier attempt can't accidentally satisfy someone else's check. It has to
survive both the save-redirect *and* a plain reload of the exercise URL — reopening a lesson's
"Start this exercise" a second time to add another case must not reset the clock and orphan the
case already written — so it's read from `sessionStorage`, not component state, whenever the
`academy` param reappears for the lesson already being tracked.

**One deviation.** §6.2's own illustrative example named "the Checkout suite" for the
boundary-value-analysis checker. It ships against **Cart** instead — that's where the fixture's
own reference case for the same quantity field already lives, and it keeps the BVA and "writing
test cases" checkers scoped to different suites so neither can be satisfied by the other's work.

**Verified:** `scripts/academy-checks-selftest.mjs` runs as part of `prebuild` — *"academy-checks-
selftest: OK (5 checkers, good and bad submissions)"* — a good and a bad fixture per checker,
including the specific case a boolean-coverage checker would get wrong: BVA rejects 0/1/100
*without* 99 even though that's "3 of 4" boundaries, because 99 is the one the lesson exists to
teach. `e2e/academy.spec.ts` **TC-E2E-100** (a thin case fails with feedback naming the missing
99; the coach stays docked through the save redirect; a second, complete case in the same suite
passes and marks the lesson done) and **TC-E2E-101** (the defect-based checker, on the branch
where `?academy=` survives without sessionStorage; "Mark done anyway" on a lesson nothing was
submitted for). Regression: `shared-steps` and `case-history` specs green — both exercise
`cases/new` and were the ones most likely to notice `AcademyCoach` mounted globally.

**Acceptance, restated against what shipped:** from a lesson, one click lands on the real case
(or defect) form with the coach docked; a deliberately bad submission gets specific, actionable
feedback and is not marked done; a good one passes and marks the lesson done; "Mark done anyway"
works regardless.

### A-05 — Persistence: progress, claim-at-signup, `/academy/me` `[x]`

> **Status: DONE** (2026-08-11, branch `feat/academy-persistence`).

**Delivered:** `LessonProgress` model (`userId`, `trackSlug`, `lessonSlug`, `status`,
`completedAt`, `@@unique([userId, lessonSlug])`); four server actions in `src/app/actions/
academy.ts` — `getMyLessonProgress()`, `markLessonDoneAction()`, `markLessonNotDoneAction()`,
`claimAcademyProgress()`; `/academy/me` (progress per published track, a Start/Continue/Review
resume link per track); a "Continue learning" card on the app dashboard, in the same
`<section className="rounded-xl border ...">` shape the rest of that page already uses — the work
order's "the `DashboardWidgets` pattern" turned out to name a styling convention, not a component
to import, since no such component exists in this codebase.

**Where the DB boundary actually sits.** `localStorage` (`tf_academy_progress`, A-02) stops being
the record of truth once a session exists and becomes a **local cache of the DB** instead —
`src/lib/academy/progress.ts` still owns `readProgress()`/`markDone()`/`markNotDone()`, and every
existing caller (`SelfCheck`, `AcademyCoach`, `LessonDoneToggle`) is unchanged in shape, just now
passing a `trackSlug` through so a DB write has somewhere to file itself. `ensureSynced()` is the
new piece: fetch DB progress → if `localStorage` has anything, claim it → write the DB's answer
back into `localStorage`. Cached at module scope so N progress components on one page cost one
round trip, triggered from `useProgressTick` (existing components) plus two new always-mounted,
render-nothing components — `AcademySync` in `src/app/(app)/layout.tsx` (every authenticated page)
and `AcademyMeSync` in `/academy/me` itself, which also calls `router.refresh()` once synced so
the page it's on doesn't need a manual reload to show what it just claimed.

**Two real bugs found by testing this against the actual browser, not just the logic in isolation**
(both are load-bearing comments in `src/lib/academy/progress.ts` now):

1. **The stale-"anonymous"-forever cache.** `<form action={...}>` server actions redirect via
   Next's router, not a hard navigation, so the module that ran `ensureSynced()` on an anonymous
   page and cached a resolved "not authed" promise *survives* signing in. A promise cached forever
   would answer "not authed" for the rest of the tab's life and the claim would never fire. Fixed
   with a `settled` flag that only latches once a check has resolved *authed* — an anonymous result
   leaves the door open for the next caller to check again.
2. **The claim-failure data-loss bug — the sharper one.** If `claimAcademyProgress()`'s request
   itself never completes (a real network blip, or — what actually reproduced it — the browser
   tearing down the page mid-flight because a hard navigation followed right after triggering it),
   the code used to fall through to `write(result.progress)` anyway, where `result` was still the
   *pre-claim* DB snapshot fetched a moment earlier. That silently **overwrote `localStorage` with
   a copy missing the very lessons that were waiting to be claimed** — permanently, since the next
   sync would see nothing left to claim. Fixed by leaving `localStorage` (and `settled`) untouched
   on a failed claim, so the next `ensureSynced()` call genuinely retries instead of quietly
   discarding progress no one ever saw fail. Found via `page.on("console")` capture on a failing
   Playwright run, not by inspection — the failure mode doesn't announce itself in a code review,
   only in a debugger session watching an actual claim attempt get cut off mid-flight.

**Verified.** `e2e/academy.spec.ts` **TC-E2E-102** (finish two lessons signed out, sign in as a
fresh account, both show done on `/academy/me` and on their own lesson pages; revisiting
`/academy/me` — a second, genuine `claimAcademyProgress()` call with the same already-claimed
local data — changes nothing, asserted against both the UI and a direct `LessonProgress` row
count) and **TC-E2E-103** (`/academy/me` and the dashboard widget reflect real DB progress
accumulated by earlier tests in the file; the sidebar's "My progress" link reaches it). Full
`e2e/academy.spec.ts` (18 tests) and the adjacent `shared-steps`/`case-history` specs — the ones
most likely to notice a component now mounted on every authenticated page — all green, run
repeatedly against a freshly reset dev database to rule out both flakiness and (the harder-won
lesson from this work order) a locally corrupted `dev.db`/stale Prisma Client masquerading as one.

**Acceptance, as specified:** finish two lessons signed out, sign up, and both are already ticked
— confirmed by TC-E2E-102 signing in as a brand-new account, not by inspection. Running the claim
twice changes nothing — confirmed by both the UI (still "2 of") and a `LessonProgress.count()`
staying at exactly 2 after a second claim attempt.

### A-06 — Exam engine + ISTQB practice exam `[x]`

> **Status: DONE** (2026-08-11, branch `feat/academy-exam`).

**Delivered:** `ExamAttempt` model (authed attempts only — see below); the exam engine, split the
same way the sandbox checkers are (§6.2): `src/lib/academy/exam-core.mjs` is plain, pure ESM
(`drawQuestionIds`, `gradeAttempt`, `isLate`, no DB, no JWT — unit-tested by
`scripts/academy-exam-selftest.mjs`, wired into `prebuild`), and `src/lib/academy/exam.ts` is the
`server-only` typed wrapper that draws from the real question bank and signs/verifies the start
ticket (`jose`, same `AUTH_SECRET`-derived-key pattern as `src/lib/superadmin.ts`). The question
bank (`src/content/academy/questions/**`, 70 questions — see the deviation below) and the
blueprints (`src/content/academy/exams.ts`: `ctfl-v4-full` and six `ctfl-v4-ch<n>` chapter quizzes,
sharing one `ExamBlueprint` shape and one `ExamRunner` UI, docs §5.2's "reusing the same engine").
Server actions in `src/app/actions/academy.ts`: `startExamAction`, `submitExamAction`,
`getMyExamAttempts`, `getExamAttempt`. UI: `src/components/academy/ExamRunner.tsx` (start screen →
one-question-per-screen with a navigator grid, flag-for-review, a confirm-submit dialog showing
unanswered/flagged counts, a live countdown with a colour change under 2 minutes, auto-submit at
zero) plus three routes — `/academy/istqb/practice-exam` (full paper), `/academy/istqb/practice-
exam/chapter/[chapter]` (the six quizzes, `dynamicParams = false`), `/academy/istqb/practice-
exam/[attemptId]` (persisted, session-scoped review) — and an "Exam attempts" section on
`/academy/me`.

**The timer is server-authoritative, exactly as §2.3 specifies, and it's isolated into one pure
function so the acceptance criterion is actually checkable without a browser.** `startExamAction`
draws the paper and signs `{ templateSlug, questionIds, seed, startedAt, durationSec }` into a JWT
— the *only* clock that matters. `isLate(startedAtMs, durationSec, nowMs, graceMs)` in
`exam-core.mjs` takes no client-supplied "elapsed" value as a parameter at all, which is what makes
a tampered client clock irrelevant by construction rather than by a check that could be skipped: a
late submission is graded exactly as answered (never discarded — a client that raced the timer and
only got partway through should see a score for what it actually answered) with a `late: true` flag
surfaced on the result.

**The route table's "session or signed ticket" auth for `[attemptId]`, resolved one way.** The plan
left two auth mechanisms open for that route. This work order took the simpler of the two: an
anonymous submission is graded and shown **inline** on the exam page itself (no navigation, no row
— §2.4), while `[attemptId]` is session-scoped only, serving the persisted, revisit-from-`/academy/
me` view. A signed "result ticket" as a URL segment (the other option the route table implied) would
have added a second ticket format for an anonymous learner to bookmark a result they can't return to
anyway once `localStorage`/the tab is gone — not worth it until there's a concrete reason to keep an
anonymous result addressable across visits.

**One content-scope deviation, flagged up front rather than discovered by a reviewer.** §9 calls the
bank "the cost, not the code" of this feature, and that held: this work order ships **70 questions
(12 per chapter except chapter 5, which has 10)** against the plan's ≥300/5× target — enough to draw
the full blueprint (chapter 4's 11 is the largest weight) and every chapter quiz (8, not the plan's
10 — also sized to this bank) without a repeat inside one paper, but well short of 5×, so different
seeds' papers will overlap more than the target design calls for.

> **Corrected 2026-08-12 (A-10 audit).** This entry originally recorded "72 questions (12/chapter)".
> The bank has always held 70 — chapter 5 has 10, not 12 — and the shortfall lands on the chapter the
> blueprint draws 9 from, so it is the sharpest instance of the overlap problem the paragraph above
> predicts, not a rounding error. Nothing caught it because `scripts/academy-exam-selftest.mjs` runs
> against a synthetic 12-per-chapter bank rather than the real content. A-10a closes both gaps. Every question still carries a real `syllabusRef` for review, and
`src/content/academy/questions/index.ts` documents this as tracked content debt for a follow-up
work order rather than silently shipping under-target. The **chapter weights themselves** (§5.1's
own "verify before seeding" warning) were taken from the CTFL v4.0 syllabus structure as read for
this work order and still need a human check against the currently published numbers before anyone
studies for the real exam from this bank.

**Verified.** `scripts/academy-exam-selftest.mjs` (`prebuild`) — same seed reproduces the same
paper; a different seed doesn't; no repeats within a paper; **drawn chapter counts match the
blueprint over 1000 seeded draws** with zero violations; full/partial/zero grading and the 65%
pass line; `isLate` at the exact edge of the grace window and just past it. `scripts/academy-
bundle-check.mjs` (`postbuild`, unchanged — it already walks all of `src/content/academy/**`)
covers the new question files with no changes: *"109 explanations, 109 client chunks, 0 leaks"*.
`e2e/academy.spec.ts` **TC-E2E-105** (anonymous chapter quiz grades inline; `ExamAttempt.count()`
unchanged before/after — the actual "zero rows" acceptance criterion, not just "no visible
attempt-id"), **TC-E2E-106** (signed-in attempt redirects to its own `[attemptId]` page, a real row
exists with the right `total`, and it shows in `/academy/me`'s attempt history), **TC-E2E-107**
(full-exam start screen shows the real 40-question/60-minute blueprint and the extra-time
checkbox), **TC-E2E-108** (no explanation text or `correct`/`correctChoiceIds` on the page either
before *or during* an attempt — checked against whichever 8-of-12 questions the seed actually drew,
since asserting on one fixed question would be testing the seed, not the boundary). All 20 specs in
the file, including the pre-existing A-01…A-05 ones, pass together (~1.2 min). Manually walked
through both the anonymous and signed-in flows in a live `next dev` browser before writing the e2e
— which is what surfaced a stale-session edge case worth recording: `getSession()` trusts its JWT
without checking the user row still exists (true of every Academy action, not new to this one), so
a cookie left over from a deleted user 500s instead of behaving like "signed out". Not fixed here —
it's pre-existing behaviour across the whole app, not a regression — but worth a dedicated look.

### A-07 — Certificates & shareable badge `[x]`

> **Status: DONE** (2026-08-13, branch `feat/academy-a07-certificates`). Implemented as specified:
> `Certificate` model, HMAC-derived serial, `/academy/certificate/[serial]` public page with a
> generated OG image (following `src/app/opengraph-image.tsx`), issued on track completion and on a
> passing exam, revocable, disclaimer per §7.4.

**Why this one waited for A-10.** A certificate is the first Academy artifact that makes a claim to
someone who was not there. A-06 shipped an exam a candidate could pass by always picking the first
choice (~50%, against a 65% line) on a paper whose ticket could be replayed with the answer key the
review screen had just handed back. Minting a shareable record on top of that would not have been a
feature; it would have been a way to publish a false statement about somebody. So issuance sits
*after* the `ExamAttempt` row is written: `@@unique([userId, seed])` (A-10b) is what makes a
replayed ticket fail before this code is ever reached, and the certificate inherits that protection
instead of carrying a rule of its own.

**The serial is derived, not random, and stored, not recomputed.** `HMAC(secret, "academy-
certificate" | kind | refSlug | userId)`, 16 symbols over Crockford's base32 (no I/L/O/U, because a
serial gets transcribed by hand more often than any other identifier here) — 80 bits, and that
entropy *is* the access control on a page with no session. Deterministic, so issuing the same
achievement twice computes the serial that already exists and the unique index turns a double-issue
into a no-op rather than a second row — the same move A-10b made for replays, one level up. Stored,
so rotating `AUTH_SECRET` cannot break a link already out in the world; `@@unique([userId, kind,
refSlug])` is not redundant with `serial @unique` but is what stops a rotation minting a duplicate
for an achievement someone already holds.

**Four decisions worth naming, because each has a defensible opposite:**

- **`scorePct` is the best passing score; `issuedAt` is the first.** A learner who scrapes a 68% and
  retakes at 90% would otherwise show 68% forever. "First earned" and "best so far" are two true
  statements; one averaged number would be a half-truth.
- **`revokedAt` is the holder's visibility switch, and a hidden certificate 404s** rather than
  rendering "withdrawn by its holder" — which is precisely the sentence someone withdrawing a link
  does not want published. An *administrative* revocation means the opposite thing (a reader
  following a stale link deserves to be told) and needs its own reason field and page state. It is
  not this boolean read backwards.
- **Only the full paper earns an exam certificate.** Six more per learner for the chapter quizzes
  would say nothing the attempt history doesn't, while making the one that means something harder to
  pick out (§7.4).
- **`NOINDEX` on the page, deliberately *not* in `robots.txt`.** The meta tag keeps a page carrying
  somebody's name out of search results; a robots entry would stop LinkedIn, Slack and WhatsApp
  fetching it at all, killing the share card the OG image exists to produce. Compare `/share/` in
  `src/app/robots.ts`, where killing the preview is the point.

Track completion is issued from `claimAcademyProgress` as well as `markLessonDoneAction`: a track
finished anonymously and claimed at signup never passes through the toggle, and swallowing its
certificate would break the one funnel §1 is built around.

**What the verification pass found.** The first cut was written in one sitting and left its own
selftest, e2e and this write-up to a second; three things turned up in that pass that reading the
diff again would not have produced.

- **`Certificate` was missing from the backup's `MODEL_ORDER`** (L-05). `scripts/backup-selfcheck.mjs`
  failed the build the first time `prebuild` ran — a schema PR that adds a model without placing it
  in that list silently drops the model from every backup, which for this table means restoring an
  instance and finding every shared certificate link dead. Placed after `User`, its only foreign key.
  Worth recording that the guard did exactly what it was written for, on the first feature to test it
  in a while.
- **A hard-coded fixture serial made two of the new e2e tests unrepeatable.** They passed once; a run
  that failed before its cleanup left the row behind, and every later run then died on `serial`'s
  unique index instead of on whatever it was testing. Fixture serials are now generated per run.
- **The progress layer has two paths that persist a toggle, and the test spent three drafts learning
  it.** `markDone` writes `localStorage` and fires `markLessonDoneAction` without awaiting it — but
  only once `ensureSynced()` has set `authed`. Before that, the click writes `localStorage` alone and
  the write reaches the database later, through `claimAcademyProgress`, whose request body carries
  the *whole* progress map. So the first draft of TC-E2E-118 asserted "no certificate yet" against a
  database no action had touched and **passed with the completeness gate deliberately removed**; the
  second waited for "a request mentioning this lesson", which the claim satisfies, so it proceeded
  while the sync was still in flight — and the claim's `localStorage` overwrite then silently undid
  the un-toggle it had just performed, which is what stuck the button at `aria-pressed="true"` for 33
  polls on CI. **Which request carries the write is a race the test has no business pinning down.**
  It now polls the row count (the same fact either way) and takes its negative assertion after a full
  navigation, re-verified against the mutated build.

  Worth recording as an app observation rather than a test one: a late `ensureSynced()` overwrite can
  leave the toggle showing *done* for a lesson the database has just un-marked, until the next
  reload. Harmless in ordinary use — nobody un-marks a lesson within the sync window — and out of
  scope here, but it is a real disagreement between the button and the row behind it.

- **The un-toggle/re-toggle sub-case was cut rather than stabilised.** It was there to prove issuing
  the same achievement twice is a no-op, and every attempt to drive it through the toggle fought the
  sync design above instead of testing A-07 (a stale `localStorage` entry is a *claim source*, so the
  cache can re-create the very row the un-toggle deleted). The same property is now proved on the
  exam path in TC-E2E-117, which has no client cache in it at all: sit a second full paper, and the
  certificate is still one row with the same serial and the same `issuedAt`.

**Verification.** `scripts/academy-certificate-selftest.mjs` (wired into `prebuild`, the house
pattern from `exam-core.mjs`) covers what no e2e can see: determinism over 1000 repeats, that every
field of the achievement and the secret change the serial, that the NUL join keeps field boundaries
unambiguous, that 20,000 serials use all 32 symbols evenly (no modulo bias) and collide zero times,
normalization, and a golden vector. Each was proved to fail by re-injecting the defect it exists to
catch — joining with `""`, `% 30` instead of `% 32`, and a `Math.random()` in the input — the same
way A-10a's and A-10d's assertions were checked. Four e2e specs, **TC-E2E-117** (sit the whole
40-question paper answering correctly, certificate issued at 100%, page and its `og:image` read from
a fresh cookie-less context, then a *second* paper sat to prove re-issuing is one row with the same
serial and the same `issuedAt`), **TC-E2E-118** (the lesson that completes a track earns it, the one
before it does not), **TC-E2E-119** (link off → 404, back on → same serial)
and **TC-E2E-120** (a signed-in stranger replaying the toggle action against someone else's serial
changes nothing). 118, 119 and 120 were each proved to fail against a mutated build — the
completeness gate removed, the `userId` dropped from the `updateMany` filter, and the `revokedAt`
check dropped from `getPublicCertificate`.

TC-E2E-117 imports the answer key from the six chapter modules directly. They carry a *type-only*
import and nothing else, so unlike `src/content/academy/questions/index.ts` — `server-only`, for the
answer key's sake — they can be read from a spec. The alternative was 40 hard-coded answers that go
stale the next time A-10d touches the bank.

**Deliberately not in A-07:** a PDF or any offline-verifiable document (the URL is the credential —
same shape as F-17 share links and L-01 badge tokens; a PDF would imply a signature this does not
have); administrative revocation with a reason and a "this credential was withdrawn" page state,
which is a different feature wearing the same column's name; and a LinkedIn "add to profile" deep
link, which wants a real issuing-organisation id and would overstate what this is.

#### A-07b — the sample certificate on the roadmap `[x]`

> **Status: DONE** (2026-08-24). A *See a sample certificate* button under a **What you get at the
> end** section on `/academy` and `/id/academy`, opening a dialog with a specimen of either kind.

A-07 shipped the artifact and left the funnel with no way to see it: the only route to a certificate
was to earn one, so the reader deciding whether a track is worth two hours could not see what the
two hours produce. The fix is small; the constraint on it is not.

**One component, two surfaces.** The card markup left the page and became
`components/academy/CertificateCard.tsx`, which `/academy/certificate/[serial]` and the sample both
render. A specimen that has drifted from the real certificate is worse than no specimen — it makes a
promise the product then breaks — and sharing the component is the only form of that guarantee a
reviewer cannot forget to check. `CertificateDisclaimer` came out with it, because §7.4's paragraph
is part of what the certificate *says*, not part of what a page says about it; it takes the ISTQB
text as a prop, since `@/content/academy` is `server-only` and the sample's wrapper is a client
component (the handoff `TrademarkNotice` already documents).

**Marked as a specimen on three axes, because one is a screenshot away from being lost.** A
`SAMPLE` / `CONTOH` ribbon rendered *on* the card, so it survives a crop; a placeholder holder name
rather than an invented person; and a serial whose first three groups are hand-written inside
Crockford's alphabet to read as `TF-5AMP-1E00-TRAC-…` — real in shape, unmistakable in content, and
deliberately not `TF-0000-0000-0000-0000`, which TC-E2E-119 already uses as its known-bad serial.
The last group is four symbols of `Math.random()`, drawn when the dialog opens: indefensible for a
real serial and exactly right for a fake one, because a fixed tail is a string somebody eventually
quotes back as *the* certificate id. It is drawn on open rather than at module scope precisely
because the dialog is absent from the server-rendered markup, so there is no server value for a
client value to disagree with. The dates stay fixed constants for the mirror-image reason: a
specimen dated `new Date()` quietly claims to be a fresh issue, and a server-rendered "today" is a
hydration mismatch waiting for the clock to cross midnight mid-render.

**The card stays English on `/id/academy`.** Everything around it is translated — section, button,
tabs, note — but the specimen is the document an Indonesian learner will actually receive, and the
Indonesian note says so in as many words. Translating the mock-up would have been the friendlier
lie.

**It is a document, so it is light, and it is the issuer's brand.** `.tf-certificate` in
`globals.css` re-declares the light tokens on the card's own subtree — the technique `.tf-print-doc`
already uses for paper (F-39, §7.6 "paper is always white") — and pins the accent ramp with it, for
the reason F-46 gives there: a custom accent is written inline on `<html>` and no descendant
selector can outrank it, but these sit *on* the card. So the certificate is TestForge indigo on an
instance themed emerald, and identical in dark mode. Both halves are deliberate: a credential
travels as a link **and** as a screenshot, and two readers comparing one serial must not be looking
at two different documents. Nothing in the component hardcodes a colour — it all still resolves from
the token layer, which is simply a local one here, so `check-theme-tokens` stays green on it.

**Verification.** **TC-E2E-141**: the dialog is absent until asked for, carries the sample mark and
the placeholder name, switches between the two kinds (no score on a track, 85% and the ISTQB
paragraph on the exam), closes on Escape, repeats in Indonesian with `Contoh` and a `lang="id"`
note — and the `Certificate` row count is unchanged either side, which is the assertion that matters:
looking at a specimen must never issue one. Two assertions were proved against a mutated build
rather than reasoned about: the serial regex pins the readable prefix *and* a four-symbol Crockford
tail, so a hard-coded `K000` cannot pass it, and the light-only rule is checked by adding the `dark`
class the theme switcher sets and reading the card's painted background back — flipping
`--tf-certificate`'s `--tf-surface` to the dark value fails it with `rgb(15, 23, 42)`. TC-E2E-118/119
were re-run against the extracted component to confirm the real page renders unchanged, and
TC-E2E-91 covers the new section at 375px.

#### A-07c — the name on the certificate, frozen and correctable `[x]`

> **Status: DONE** (2026-08-25). Closes the second of §9's three open questions — *name on the
> certificate: account name, or user-editable at issue time?* The answer turned out to be neither
> of the two on offer.

**The question understated the problem.** `holderName` was not stored at all: `getPublicCertificate`
read `User.name` live on every render, and `User.name` is itself not editable — the Account page
displays it, and its value came from whatever the OAuth provider had. So the name on a TestForge
credential was simultaneously **unfixable by its holder** and **silently mutable by the provider**,
which are the two worst halves of both options in the question.

The second half is the serious one. A-07b had just finished arguing that a certificate travels as a
link *and* as a screenshot, and that two people comparing one serial must not be looking at two
different documents. A live-resolved name breaks exactly that: change your display name on GitHub
and every certificate you have ever shared is retroactively re-issued to somebody else's name, while
the screenshots in circulation keep the old one. Nothing warns anyone, and the verify URL — the only
thing that makes the serial checkable — is what serves the contradiction.

**Frozen at issue, correctable by the holder.** `Certificate.holderName` is copied from the account
once, in `issueCertificate`, and never re-read; a later re-earn at a higher score updates `scorePct`
and nothing else. `/academy/me` grows a *Change name* control per certificate, because freezing alone
would have preserved `qa-handle-99` on a credential forever. There is no approval step and no
identity proof, and that is not a gap: this name was **always** self-asserted — it arrived from an
OAuth profile nobody verified. What is new is that the holder can fix it and that every change
writes an `academy.certificate_rename` audit row, so a rename is a fact on the record rather than
something that happened invisibly.

**The serial does not move on a rename**, and that is the property the whole feature rests on. It
derives from `{userId, kind, refSlug}`, none of which a rename touches — so an already-shared link
keeps resolving. Re-deriving would have turned every copy in circulation into a 404 the holder never
intended, which is the same reasoning A-07 used to keep the switch in `revokedAt` rather than in the
serial.

**Legacy rows, and where the backfill lives.** The column is nullable, and a null still resolves
live from the account, so an instance that has not run the backfill renders a name rather than a
blank line. The backfill itself is in `prisma/seed.mjs`, above the seeded-already early return: the
deploy path is `prisma db push && node prisma/seed.mjs` on container start, and that early return is
the only reason a live instance would otherwise never reach it. It is idempotent by construction —
it matches on `holderName: null`, so a row that has a name, including one the holder chose, is never
matched again. Verified by running it three times against a hand-made legacy row: `null` → the
account name, then a holder-chosen name left untouched on both later runs.

**Validation is deliberately permissive about characters and strict about shape.** Names carry
accents, hyphens, apostrophes, non-Latin scripts and titles, and a validator that "cleans" those is
one that tells people their own name is malformed. `normalizeHolderName` collapses control
characters and runs of whitespace, trims, rejects empty, and caps at 70 — a ceiling that stops a
paragraph being typed into a card that centres one line, not a claim about what fits.

**Verification.** **TC-E2E-142** walks the whole shape on one row: the legacy fallback renders the
account name, a blank submission is refused *and leaves the row null* (asserted before the
successful save, so a working rename cannot be what makes the row right), `  Sri  Wahyuni  ` stores
collapsed, the serial is unchanged and the public page still resolves — and then the account is
renamed in the database and the certificate does **not** follow, which is the property the column
exists for. **TC-E2E-143** replays the rename action with someone else's serial swapped in, the same
technique TC-E2E-120 uses against the visibility toggle, and here for a sharper reason: hiding
someone else's certificate vandalises it, but renaming one would let an attacker put their own name
on a credential somebody else earned. **TC-E2E-118** gains one line — the freeze happens on the real
issue path, not only in a fixture.

Both new tests were **proved to fail**: dropping the freeze back to `cert.user.name` fails TC-E2E-142
with `Expected "Sri Wahyuni" / Received "qa-handle-99"`, and removing `userId` from the `updateMany`
filter fails TC-E2E-143 with the victim's row reading `Attacker Renamed` — the attack itself,
demonstrated rather than argued.

### A-08 — Content build-out & localised routes `[x]`

T2/T3/T4 to `published`; the remaining sandbox checkers; the T3 CI capstone;
Indonesian lesson bodies; and — if ID organic traffic justifies it — `/id/academy/**` with
`hreflang`, decided on A-03's measured numbers rather than up front.

**Started 2026-08-14 with one lesson, deliberately.** T2's `test-planning` is written; the other
eleven T2 lessons are still `planned()` stubs and **both the lesson and the track stay `draft`**, so
this adds no route, no sitemap entry and no visible change — §9's "`status: draft` lets tracks land
incrementally", used literally. It is a sample of shape for the owner to judge before ~57 more
lessons are written to it: length, voice, the worked-example block, and three self-check questions
with teaching explanations rather than verdicts.

`src/content/academy/tracks/manual-pro.ts` became a directory in the process, matching T1's layout —
one module per written lesson, `planned()` stubs for the rest, in `index.ts`.

**Second slice 2026-08-14: T2 lessons 2–4** — `risk-based-testing`, `exploratory-testing` and
`test-oracles`, taking T2 to **4 of 12 written**. Everything stays `draft`, so this is again no
route, no sitemap entry, no visible change. Written **in roadmap order**, which was one of the two
open questions below: the order is not arbitrary, because each lesson's closing `**Next:**` line
already names the one after it — `test-planning` ended by promising the risk ranking, and this slice
is what makes that promise true. Writing sandbox-first would have left those pointers aimed at
nothing.

`exploratory-testing` carries `sandbox: true` with **no `SANDBOX_TASKS` entry and no checker**, which
is the degradation A-04b built for: the lesson page renders the generic hands-on callout with an
"Open your sandbox" link rather than a "Start this exercise" button. That is deliberate here —
a session-based-testing checker has to grade a *charter and notes*, not the shape of a case row, and
that is a different design problem from the five T1 checkers. It gets its own slice.

**Third slice 2026-08-14: T2 lessons 5–7** — `http-and-devtools`, `api-testing` and `sql-for-qa`,
taking T2 to **7 of 12 written**, still all `draft`. These three are the track's technical block and
they were written as one slice because they are one argument told in three places: the network tab
shows you what the client sent, the API lets you send what the client cannot, and the database shows
what was actually stored. Each lesson's closing `**Next:**` hands over to the following one, and
`test-oracles` had already pointed at the first.

`api-testing` is the second `sandbox: true` lesson without a checker, for the same reason as
`exploratory-testing` — see below.

**Fourth slice 2026-08-14: T2 lessons 8–10** — `cross-browser-mobile`, `accessibility-basics` and
`non-functional-basics`, taking T2 to **10 of 12 written**, still all `draft`. The track's
quality-attribute block, and one slice for the same reason as the last one: compatibility and
accessibility are two of ISO 25010's characteristics, so the third lesson is the frame the first two
turn out to be instances of — it opens by saying so rather than introducing them as unrelated
topics. `sql-for-qa` had already pointed at the first.

Written against the *criterion*, not the vibe, because that is the difference between a report that
gets scheduled and one that does not: every check in `accessibility-basics`' ten-minute pass names
the WCAG 2.2 criterion it fails (2.4.7, 2.4.3, 2.1.2, 2.4.11, 1.3.1, 1.4.10, 1.4.4, 1.4.3, 1.4.1,
4.1.2, 3.3.1, 3.3.7), and `non-functional-basics` makes "a number without its conditions and a target
is an opinion" the shape of every finding it teaches.

**No new checker debt in this slice** — none of these three is a 🛠 lesson in §4, and none carries
`sandbox: true`, so the count below stays at two.

`non-functional-basics` teaches seven security checks a manual tester can run (authorization by URL
first, since broken access control is both the highest-yield and the class scanners are worst at),
and it carries **rules of engagement as a hard boundary rather than a footnote**: authorization in
writing, only the environments it names, no third parties in the flow, no destructive payloads, no
real customer data, and on a real finding — stop, document, report through the security channel,
do not keep digging. A lesson that teaches people to probe access control without that paragraph
would be teaching them to get fired.

**Fifth slice 2026-08-14: T2 lessons 11–12, and the track published** — `metrics-that-mean-something`
and `reporting-to-stakeholders` complete the track at **12 of 12**, and `manual-pro` flips to
`published` along with all twelve lessons. **This is the first A-08 slice with a visible change**:
thirteen new routes, thirteen new sitemap entries, and a roadmap card that is now a link rather than
a "coming soon" panel.

These two are one argument as well — the previous lesson produces numbers, this one turns them into
a decision — which is why `reporting-to-stakeholders` opens by refusing the dashboard link as a
report. Its spine is a five-sentence release recommendation (scope *and* exclusions, state, risk in
the reader's currency, recommendation with its condition, and what would change the answer), plus
the two things a tester has to be able to say under pressure: never "it is ready", and observation
separated from judgement so that an overruled judgement leaves the evidence standing.

**The open question is answered: flip at 12, not at 10.** Three reasons, in order of weight. The
track's own `outcomes` promise "report status in terms a product owner acts on", and that outcome
lives entirely in the last two lessons — publishing at 10 would have shipped a track whose stated
outcome was not in it. A clickable card leading to ten written lessons and two dead entries is a
worse first impression than a card that says "coming soon", and the roadmap already renders the full
lesson list either way, so nothing was hidden by waiting. And it was one slice away.

**It also closes a live 404.** T1's final lesson (`testing-in-agile`, published since A-01) ends by
pointing at [Manual QA Professional](/academy/manual-pro) — a link that has been landing on a 404 in
production for as long as T1 has been published, because `getTrack()` filters drafts. Publishing T2
is what makes it resolve. Worth recording as the general hazard rather than the one instance: a
published lesson may link to a draft route, and nothing in the build catches it.

**Sixth slice 2026-08-14: T3 opens with one lesson** — `what-to-automate`, and nothing else. The
same deliberate move the first slice made for T2: a sample of shape for the owner to judge before
eleven more are written to it, and T3's shape genuinely differs from T2's (code blocks, an assumed
repository, and a reader who will be running things rather than reading them). The track and the
lesson stay `draft`, so this is again no route, no sitemap entry, no visible change.

`src/content/academy/tracks/automation.ts` became a directory in the process, matching T1 and T2.

**No language-path decision was needed:** A-01's outline already committed T3 to the JS/TS +
Playwright path — lesson 2's summary says "JS/TS path" and the capstone uploads JUnit XML to
`/api/v1/junit` — so the Python alternative §4 mentions is a later branch of the content, not an open
question blocking this track. Recording it here so it is not re-litigated per slice.

The lesson argues the economics rather than the tooling, because the tooling lessons that follow are
worthless to someone automating the wrong things: the payback sum, the pyramid *and* its serious
critics (trophy, honeycomb) reduced to the one principle they agree on — push each test as low as it
can go while still saying something true about what the user gets — the wrong-layer mistake worked
through as twelve UI tests for password rules, and the maintenance cost, where flake rate connects
back to T2's metrics lesson. It closes on what automation is *not*, because "automation replaces
manual QA" is the misconception this whole track is otherwise liable to reinforce.

**Seventh slice 2026-08-14: T3's `programming-foundations`**, taking the track to 2 of 12, still
`draft`. **The "sample of shape" from the sixth slice was not held for review before this one** — the
owner delegated the decision to continue — so that slice is a review *checkpoint* rather than a gate,
and the two lessons remain separately reviewable in their own PRs. Recording it plainly because the
sixth slice's own rationale said the opposite, and a reader comparing the two entries deserves the
reason rather than a contradiction.

The lesson is the track's only pure-syntax one and it is written against the smaller target: **read
and change test code without being afraid of it**, not "learn JavaScript". Roughly a third of it is
`async`/`await`, because a missing `await` is the ecosystem's biggest source of flakiness and its
signature — a failure that lands in the *next* test — is unguessable if nobody says it out loud.
The other unusual choice is a section on **reading somebody else's suite** (start at the name, find
the `expect` first, read backwards, change nothing cosmetic on day one), since nobody's first
automation job is green-field.

It also plants the capstone's constraint eight lessons early: **name tests so they map to case ids**,
because `/api/v1/junit` matches on test names, and retrofitting that convention across 400 tests
costs a sprint while deciding it in week one costs nothing.

**Eighth slice 2026-08-14: T3's `first-playwright-test` and `locators`**, taking the track to
**4 of 12**, still `draft` — no route, no sitemap entry, no visible change. Back to more than one
lesson per slice, because these two are **one argument split across two pages**: the first writes a
test and deliberately defers every locator decision in it, and the second is that decision. Shipping
`first-playwright-test` alone would have left its central choice — `getByRole` over the selector
devtools hands you — asserted and unexplained for however long the next slice took.

`first-playwright-test` is the track's first sandbox lesson, and it follows T2's precedent rather
than T1's: `sandbox: true` with the exercise written as prose, no `SANDBOX_TASKS` entry and no
checker. **That is A-04 debt, not an omission here** — the note below now covers four hands-on
lessons rather than three. What the exercise asks for is deliberately not "a passing test": step
four breaks the test on purpose and asks the learner to find the failure in the trace, because
reading a red run is the skill that survives the first week and a green one is just a nice feeling.

The lesson also spends its longest section on **the trace viewer**, which is the honest answer to
the question the rest of the track keeps raising — *how do I debug this on CI?* — and the reason
`trace: "on-first-retry"` is called out as the most valuable line in the config. Retries are
documented with their hazard attached (they hide flakiness rather than fix it) so that the
flaky-tests lesson is not arguing against advice this one gave.

`locators` is written as a maintenance-cost lesson rather than an API tour, because the failure it
prevents is a suite going red on a `<div>` somebody added. Two positions in it are load-bearing:
**strict mode is a feature** — `.first()` on an ambiguous locator freezes today's DOM order and then
keeps passing while acting on the wrong element, which is worse than failing — and **a locator is a
contract**, which is what makes an asked-for `data-testid` legitimate where a copied class chain is
not. Role locators are argued for on stability *and* on the accessibility defect they catch for
free, which is where T2's a11y lesson pays off inside T3.

**Ninth slice 2026-08-14: T3's `assertions-and-waiting` and `page-objects`**, taking the track to
**6 of 12** — halfway — still `draft`, so again no route, no sitemap entry, no visible change.

**These two are not one argument, and the slice does not pretend otherwise.** The eighth slice
paired its lessons because the first deferred a decision the second made; this one pairs them
because they are the two lessons that sit either side of an arc boundary and both were ready.
`assertions-and-waiting` closes the "write one test correctly" arc that `first-playwright-test` and
`locators` opened — locators say *where*, assertions say *what* and *when* — and `page-objects`
opens the "make many tests maintainable" arc that runs to the end of the track. Recording the
distinction because the previous entry made a genuine claim of shared argument, and reusing that
justification where it does not hold would make it worthless.

`assertions-and-waiting` is built on one sentence — **an assertion is the only part of a test that
can find a bug** — and it opens with two green tests, one of which cannot fail. The load-bearing
distinction is `expect(locator)` versus `expect(await locator…)`: the first polls, the second
samples the page at one instant, and that difference is where most self-inflicted flakiness is
written. It is stated as a rule a reviewer can apply without thinking (*anywhere you see
`expect(await …)` in a UI test, you are looking at a race*), because the failure it causes shows up
only on a loaded CI runner and never on the machine that wrote it.

`waitForTimeout` is argued as **wrong in both directions at once** — too short on the worst day,
wasted on every ordinary one — which is what makes "raise the number" so durable a non-fix. The one
honest exception (an unobservable debounce) is kept, with the instruction to write the reason on the
line, since an unexplained sleep gets either deleted or copied. `networkidle` gets its own warning
for the same reason it is discouraged upstream: an app with polling never reaches silence, and
silence would not prove the element rendered anyway.

`page-objects` is deliberately half a warning. The pattern is shown minimally, and then the rule
that keeps it useful — **a page object exposes what a user can do; it does not assert** — with the
getter as the sanctioned compromise, so the page object owns *where the error lives* and the test
owns *what it should say*. Five named symptoms of the failure mode follow (one-line wrappers,
boolean parameters, component mirrors, inheritance chains, lying method chains), because "page
objects, and when they hurt" is a promise the lesson has to actually keep.

Two things in it are pointed forward rather than restated. **Fixtures are presented as the better
tool than a base class** — teardown after `use()` runs even when the test fails — which is the hook
`test-data` needs for cleanup, and `storageState` answers the "60 slow logins" problem without the
next lesson having to. And it repeats the **case-id naming convention** planted in
`programming-foundations`, because refactoring into page objects is precisely when people rewrite
test titles and silently break the capstone's `/api/v1/junit` matching.

**No new checker debt in this slice** — neither lesson is a 🛠 lesson in §4 and neither carries
`sandbox: true`, so the note below stays at four.

**Tenth slice 2026-08-14: T3's `test-data` and `api-automation`**, taking the track to **8 of 12**,
still `draft` — no route, no sitemap entry, no visible change.

**These two genuinely are one argument**, unlike the ninth slice's pair, and the previous lesson had
already promised it: `page-objects` closed by pointing at fixtures for cleanup, `test-data` arranges
its state through the API because the UI is slow and brittle, and `api-automation` is that same tool
turned on the thing under test rather than on the setup. Splitting them would have left `test-data`
using an HTTP client the track had never introduced.

`test-data` opens on the failure that teaches it — a suite where adding one test breaks a different
one — because shared state is the second-largest source of unreliable automation after locators, and
because its signature (passes alone, fails in the suite) reads as flakiness until somebody names it.
The lesson reduces to one rule, stated as a check a reviewer can apply: *could this test run alone,
twice in a row, and at the same time as a copy of itself?* Those three map to three real failures —
depends on another test, cannot survive its own rerun, collides with a parallel worker.

Two positions in it are load-bearing. **Unique data beats cleaned-up data**, with `workerIndex` in
the name rather than `Date.now()` alone, since two workers can start in the same millisecond — and
with the counter-case attached, because a test for "duplicate names are rejected" needs the same
name twice and randomising it silently deletes the test. And **cleanup will fail eventually**, so
the suite is written to tolerate residue: assert that *my* record appears rather than that there are
exactly three. It also carries data-handling boundaries as a hard rule rather than a footnote — no
real customer data even copied, `example.com` addresses, credentials from the environment — the same
shape as the rules of engagement in T2's non-functional lesson.

`api-automation` is argued as the layer most suites under-use, and its highest-value section is
**authorization**: a hidden button is not a permission check, the endpoint is, and a UI-only suite
cannot tell the difference. That is T2's "check authorization by URL first" in automated form. The
lesson is deliberate about **401 vs 403 and 403 vs 404**, the second because answering 403 for
another user's record confirms the record exists.

It also states a limit the rest of the track depends on being honest about: an API suite cannot tell
you the feature works for a person, and **cannot tell you the real client sends the request your
test constructs** — which is named as the gap contract testing closes, on T4. Without that
paragraph the pyramid argument from `what-to-automate` would read as "write fewer UI tests" rather
than "write each test at the layer that can answer it".

One small correction of expectation, recorded because it recurs: `expect(res.status())` is the
*non*-retrying form and that is correct here, since an HTTP response either arrived or did not. The
polling rule from `assertions-and-waiting` is about locators, and a reader who over-applies it would
go looking for a web-first assertion that does not exist.

**No new checker debt** — neither is a 🛠 lesson in §4, so the note below still stands at four.

**Eleventh slice 2026-08-15: T3's `ci-github-actions` and the `junit-to-testforge` capstone**,
taking the track to **10 of 12**, still `draft`. Paired because the capstone's upload step belongs in
the workflow the CI lesson builds, and shipping the capstone first would have described a pipeline
that did not exist yet.

**This slice found and fixed a real defect in already-merged content.** Four earlier lessons —
`programming-foundations`, `first-playwright-test`, `page-objects` and `api-automation` — taught
learners to name tests `TC-12`. Read against `ingestResults()` in `src/lib/result-ingest.ts`, that
form **does not match anything**: the pattern is `TC-<SLUG>-<n>` built from the project's own slug
(`new RegExp(\`TC-\${project.slug.toUpperCase()}-(\\\\d+)\`, "i")`), because a case's `seq` is unique
only within its project. A bare `TC-12` misses the id rule, falls through to the exact-title rule,
and is then compared *including* the "TC-12" prefix — so it matches nothing unless a case is
literally titled that. All four now teach `TC-SHOP-<n>` with the slug named as the variable part.

Recording it as a general hazard rather than four typos: **the track had been writing against a
remembered API rather than the one in this repository**, and nothing in the build would ever have
caught it — the lesson bodies are prose, and a wrong convention taught confidently is worse than a
missing one. The capstone was where it had to surface, because it is the first lesson whose
instructions are executed against the real endpoint.

`ci-github-actions` is built around the fact that the workflow is the easy half: the suite has to
already be environment-independent (locators, waiting) and data-independent (per-test state) before
CI is worth wiring, and both were earlier lessons. Its non-obvious details are the ones that cost an
afternoon each — `--with-deps` for the browser system libraries, `npm ci` over `npm install`,
`timeout-minutes` so a hung test does not burn six hours, and `fail-fast: false` on a shard matrix,
without which one failure cancels the siblings and hides the rest. Artifacts use
`if: !cancelled()` rather than `if: failure()`, because a green run's trace is the baseline you need
on the day something is suspicious but passing.

The capstone is written **against the endpoint as implemented**, not as remembered: the four query
parameters, the response fields including `unmatched`, and the four failure statuses with what each
one actually means. Two are worth having in the doc. **404 covers both "no such project" and "you
are not a member"** — `ingestResults()` filters on `members: { some: { userId } }` — which is
deliberate non-disclosure and makes "wrong key" and "wrong slug" indistinguishable from outside; the
lesson says so, and ties it back to the 403-versus-404 argument `api-automation` had just made.
And **422 is the expected first failure**, which the lesson frames as good news: everything worked
except the naming.

**Checker debt: the decision was to keep writing prose, not to design checkers**, consistent with
the note below. Both lessons carry `sandbox: true` with no `SANDBOX_TASKS` entry, so the count goes
from four to **six**. This was the slice where it was tempting to do otherwise, since the capstone's
artefact genuinely is inspectable — a run in the sandbox project with `matched`/`unmatched` counts —
but building that grader is a design task with its own decisions (what counts as a pass: any run? a
matched run? a *green* matched run?) and smuggling it into a content slice is exactly what the note
below rules out. What this slice does contribute is a **concrete specification for the future work
order**: the capstone's exercise now has six numbered steps whose success is visible in product
state, including a deliberate 422, which is more than any of the other five hands-on lessons offers.

**Twelfth slice 2026-08-15: T3's `flaky-tests` and `framework-design`, and the track published** —
12 of 12, `automation` flips to `published`. **The second A-08 slice with a visible change**:
thirteen new routes, thirteen new sitemap entries, and a third roadmap card that is now a link
rather than a "coming soon" panel. T4 and T5 stay unlinked and out of the sitemap, as intended.

The two lessons close two different loops. `flaky-tests` is where `retries: 2` finally earns the
hedge every earlier lesson attached to it: Playwright reports failed-then-passed as **flaky**, a
third state, and that number is the work queue — so **"green with 2 flaky" is not a green run**. Its
argument is that the cost of flakiness is not the wasted reruns but that a suite which cries wolf
trains people to re-run red, and the next genuine regression gets re-run and shipped. The five
causes are ordered by what to suspect first, with the alone-versus-suite failure-rate comparison as
the cheapest discriminator, and quarantine is given four requirements (owner, date, ticket, visible
count) that are what separate it from burial.

`framework-design` is written against one test: **a new person clones on Monday and opens a correct
pull request by Wednesday without asking you.** Nothing in it is new material — the config is
assembled from lines earlier lessons introduced — and that is the point: the lesson is about
arranging what exists so somebody else can pick it up. It ends on the track's own thesis, that what
you have built is a feedback loop rather than a pile of scripts.

**The `planned()` stub helper is gone from `automation/index.ts`, exactly as T2's was**, which is
the visible marker that a track is complete. `docs/QA-ACADEMY.md` §4's "coming soon" rendering now
applies only to T4 and T5.

**It closes the live 404 the fifth slice predicted.** That entry recorded the hazard in general
terms — *a published lesson may link to a draft route, and nothing in the build catches it* — after
T1's `testing-in-agile` had been pointing at a 404 for as long as T1 had been published. The same
thing was true a second time: T1's `test-levels` links to [the automation track](/academy/automation)
and has been 404ing since A-01. Publishing T3 resolves it.

**And this slice re-created the hazard before catching it.** `framework-design`'s closing paragraph
originally linked to `/academy/beyond` — a track that is still `draft` and still 404s — so the final
lesson of a newly published track would have shipped pointing at nothing. Caught during the render
check by testing the link rather than the page. The link is now plain prose that points at the
roadmap instead, and it can become a link when T4 publishes.

Worth stating as a rule now that it has happened twice in three slices: **the last lesson of a track
is the most likely place for this bug**, because closing lessons naturally point forward, and
forward is by definition the unwritten track. A sweep of `](/academy/` across all published content
confirms the current state is clean — four cross-links, all resolving.

**Thirteenth slice 2026-08-15: T4 opens with `performance-testing` and `security-for-testers`**,
2 of 7, `draft` — no route, no sitemap entry, no visible change. `beyond.ts` became a directory in
the process, matching T1, T2 and T3.

**T4 opens with two lessons rather than one, unlike T2 and T3, and the reason is the track's
shape.** Those tracks opened with a single sample because their lessons form a chain — each one's
`**Next:**` promises the following one, so the shape of lesson 1 determines eleven more. T4 is not a
chain: it is seven largely self-contained introductions to seven different disciplines, and the open
question is not "what does a lesson look like here" but **"how much of an entire discipline fits in
one lesson"**. One lesson cannot answer that; two calibrations can be compared.

The answer both lessons commit to: **teach the judgement, not the tool.** Performance testing and
security testing are each a career, and a 16-minute lesson that tried to be a tutorial would be
useless in both directions. So `performance-testing` spends its opening on why an average is the
wrong statistic before k6 appears at all, and `security-for-testers` spends its opening on rules of
engagement.

`performance-testing`'s load-bearing points are that **percentiles beat averages** (nine requests at
100ms and one at 1.2s averages to a comfortable-looking 210ms while one user in ten waits over a
second), that **thresholds are what make it a test** — `check()` records and continues, only
thresholds set the exit code, so a k6 script without them is the same non-test as a UI test with no
assertion — and that **a number without its conditions is an opinion**, which is T2's non-functional
lesson reused deliberately rather than restated by accident.

`security-for-testers` leads with the boundaries, at more length than T2's version, because this
lesson teaches IDOR and privilege escalation directly: written authorisation, named environments
only, no third parties, no destructive payloads, and on a real finding **stop, document, report** —
proving the door is unlocked is the job, taking inventory is not. Its argument for why a tester is
worth pointing at this at all is the honest one: you will not out-tool a penetration tester, but
**a scanner does not know that project 7 belongs to someone else, and you do**, which is why
authorisation and business-logic failures are the classes testers find and tools miss. The
authorisation matrix is given as a grid where every cell is a test, and then handed to
`api-automation`'s viewer-token pattern as the thing that automates cleanly.

**A rendering risk worth recording:** this is the first lesson whose body contains XSS payloads as
teaching material — `<script>alert(1)</script>` and an `onerror` image tag, inside a markdown table.
`<Markdown>` sanitizes and disallows raw HTML (§2.1), so they render as visible text; the render
check confirmed both appear as text with **zero `<script>` or `<img>` elements injected into the
article** and no console errors. Any future lesson quoting markup needs the same check rather than
the assumption.

**No checker debt added** — neither lesson carries `sandbox: true`; T4's only 🛠 lesson is
`portfolio`, still a stub. The count stays at six.

**Fourteenth slice 2026-08-15: T4's `contract-testing` and `testing-in-production`**, 4 of 7, still
all `draft` — no route, no sitemap entry, no visible change.

These two are a genuine pair despite T4 not being a chain, and the pairing is the argument: they are
**the two halves of the same problem, which is confidence about a running system without a full
integrated environment**. Contract testing is the half before deploy, production observability is the
half after, and each lesson says so — `contract-testing` opens on the environment it lets you not
build, `testing-in-production` opens by naming itself as the other half. Written together so the
seam is deliberate rather than an accident of ordering.

`contract-testing` picks up a debt the tenth slice created on purpose: `api-automation` states that
an API suite **cannot tell you the real client sends the request your test constructs**, and names
contract testing as the thing that closes it. The lesson's load-bearing point is therefore the
*mechanism* rather than the tooling — the consumer's own test drives **the shipped client module,
not a hand-written `fetch`**, or the pact records what the test author imagined instead of what the
application does. The other two: **matchers, not literals** (`total: 19.99` as a literal makes the
provider's test data part of the contract, and two reseeds later the verification job gets marked
non-blocking, which costs the whole protection), and **contract tests do not replace anything** —
business rules belong in the provider's own tests, so a contract test asserting a total is the
pyramid mistake repeated one layer up.

It also refuses to sell the machinery. A broker plus two wired pipelines plus a versioning
discipline pays off when **several consumers you do not control** depend on one provider; for one
consumer and one provider owned by the same team, the lesson says a schema check against an OpenAPI
spec is usually enough and names what you give up. `can-i-deploy` is included because contract
results that are not a deployment gate decay into a report nobody reads.

`testing-in-production` opens by refusing the misreading in its own title — it is not permission to
skip the other eleven lessons — and then sets **two prerequisites that are not optional**: you can
see what happens (logs, metrics, traces, reachable by the tester), and you can limit the damage
(flag, canary, fast rollback). A team with neither is not doing this as a strategy; it is happening
to them.

Its three most useful specifics. **Capture the trace id** when reproducing in production — one habit
that removes an entire round trip from every bug report. **A flag's off state is the rollback path**,
so an untested off branch is a recovery that fails during the incident it exists for; and ten live
flags are 1024 combinations, which is why the discipline is keeping the live set small rather than
testing the matrix. And **production is a source of test ideas, not just of incidents** — real usage
ranking, the real device mix (T2's compatibility lesson said to build the matrix from your own
analytics; this is that data), and untriaged error logs, plus the rule that an incident which does
not produce a test is an incident you have agreed to have again.

The synthetic-monitoring section carries rules of engagement in the same spirit as
`security-for-testers`, and its hard line is **a synthetic payment is a real payment** — cover the
journey to the provider's boundary and verify the integration in a sandbox built for it. Tagging
synthetic traffic out of analytics and revenue reporting is in the list because it is the mistake
that gets made exactly once.

Both lessons route their TestForge tie-in through `/api/v1/junit` rather than inventing a mechanism
— Pact's verification step and a scheduled synthetic run both emit JUnit XML, so it is the T3
capstone's endpoint reused. Each is also honest about what the record is worth: for contracts, one
green run proves almost nothing and the month of history is the evidence; for synthetics, TestForge
holds the record but **will not page anyone at 3am**, and saying so beats letting a reader discover
it during an outage.

**No checker debt added** — neither carries `sandbox: true`. The count stays at six.

**Fifteenth slice 2026-08-15: T4's `ai-in-qa`**, 5 of 7, still `draft`. One lesson on its own, which
is the right size here for the opposite of T2's reason: this is not a sample being calibrated, it is
the one lesson in T4 that pairs with nothing. The two remaining — `portfolio` and `interview-prep` —
are the career pair, and folding the AI lesson into them would have made a slice of three topics
joined only by being last.

**The lesson is organised around one ranking rule rather than a list of tools:** *failing loudly is
cheap, passing wrongly is expensive.* Every use is sorted by what happens when the model is wrong. A
hallucinated locator or API fails on the first run and costs a minute; an assertion inferred from a
function's name goes green forever and costs the defect it was supposed to catch. That gives the
lesson a spine that survives the tooling changing, which matters more here than in any other lesson
in the Academy.

Its sharpest point is **oracle collapse**, and it is T2's `test-oracles` lesson reused deliberately
(the same move `performance-testing` made with the non-functional lesson): an oracle must come from
outside the implementation, and **a model that was shown the implementation is not outside it**. If
one tool writes the code and the test, a misunderstanding of the requirement is encoded twice with
nothing left to contradict it. The lesson does not conclude "don't use it for both" — it concludes
the oracle stays human, supplied from the requirement before generation.

The review checklist's third question is the one it argues nobody runs: **break the code on purpose
and see whether the generated test goes red.** A test that cannot fail is decoration, and mutating
the code is worth more than any amount of reading it.

Two boundaries are stated as non-negotiable rather than advisory, in the same register
`security-for-testers` used: **confidentiality** (unreleased specs, customer data, credentials and
proprietary code do not go into an unapproved service — "it was just a snippet" is how source code
leaves a company) and **accountability** ("the AI wrote it" is not a defence; whoever merges it owns
it). The closing section is honest about which skills depreciate — typing the fortieth similar case —
and which appreciate, which is a restatement of what the previous four tracks were for.

**The TestForge tie-in is F-29 as designed, not as marketed.** AI assist is opt-in per click, runs on
the organisation's own key and endpoint, and inserts generated cases as **`DRAFT`** — the product's
own shape says the model produced a suggestion that a human promotes, which is the lesson's argument
already built into a feature. The measurable follow-up it proposes is the only one that settles the
question: tag AI-drafted cases and ask months later **which of them ever failed on a real defect**,
because pass-rate theatre (T2's metrics lesson) applies harder to generated suites than to any other
kind.

**No checker debt added** — `ai-in-qa` does not carry `sandbox: true`. The count stays at six, and
T4's only 🛠 lesson, `portfolio`, is the next slice.

**Sixteenth slice 2026-08-15: T4's `portfolio` and `interview-prep`, and the track published at 7 of
7.** The career pair, and **the third A-08 slice with a visible change**: eight new routes, eight new
sitemap entries, a fourth clickable roadmap card, and `framework-design`'s forward pointer finally
becoming a link (see below).

The two are a pair in the strictest sense in the track — `portfolio` builds the artefact and
`interview-prep` spends it. The interview lesson's closing advice is literally *"I can show you"*,
which only works because the previous lesson published something to show.

`portfolio` is argued from the reviewer's side rather than the candidate's: every QA CV claims test
design and attention to detail, none of it is checkable, and a hiring manager with two hundred
applications is looking for **a reason to shortlist**. Its three artefacts are a suite against a
*public* application (so the reviewer can hold the cases next to the real thing), execution history
(design versus having actually run and maintained it), and — the differentiator — **a written
statement of what was deliberately not tested**. Depth over breadth is argued with T2's
pass-rate-theatre question turned on the candidate: three hundred shallow cases invite *"how many of
these have ever failed?"*.

Its hard line is publishing anything belonging to an employer, including "anonymised" material, with
**check the git history, not just the working tree** stated explicitly — a secret removed in a later
commit is still published.

**The exercise is F-38 used as designed, and it is the first sandbox exercise whose subject is the
learner's own project rather than a case row.** Enable public sharing, turn on Cases, Runs and
Reports, open `/public/<slug>` in a private window and read it as a stranger, then fix the three
worst things. The lesson states two facts the settings page also states — **public means public, not
unlisted** (the URL is the project slug) and the page is `noindex` until a separate toggle says
otherwise — and lists what F-38 never exposes under any setting: comments, attachments, assignees,
defect links, per-result notes, member names. That is the Part B allow-list read back as a reason the
learner can safely publish.

`interview-prep` is organised around what is actually being assessed — can you find problems, explain
reasoning, and disagree well — with a table mapping each stock question to which of the three it is
wearing a costume of. Its most reusable piece is the four-move answer to *"how would you test X"*:
ask before you answer, state assumptions aloud, go by **category rather than list**, and say where
you would stop and why. That is T2 compressed to ninety seconds, and the lesson says so.

The "developer says it's not a bug" answer is T2's observation-versus-judgement split reused:
evidence, then the standard, then escalation **with the decision recorded** — an accepted risk
becomes a choice on the record rather than an argument that was lost.

**Two build assertions earned their keep in this slice.** `academy-trademark-check` failed the
build: `interview-prep`'s closing named the certification scheme while pointing at T5, and §7.1
requires the notice on every page that does. The fix was to reword rather than to set
`trademarkNotice` on T4 — a disclaimer on eight pages for one forward pointer is the wrong trade, and
the roadmap already names the scheme with the notice beside it. A self-check distractor mentioning
the scheme was reworded for the same reason. Worth recording because the check caught a §7.1
violation in content that had already been proofread, in a track that has nothing to do with
certification.

**And the twelfth slice's prediction came true in the right direction.** That slice recorded that
`framework-design`'s closing link to `/academy/beyond` had to become plain prose because T4 was
`draft`, "and it can become a link when T4 publishes". It now is. The `](/academy/` sweep across all
published content is clean at five cross-links, all resolving — the first time every forward pointer
in the Academy has had somewhere to go.

**Checker debt is now seven**, not six: `portfolio` carries `sandbox: true` with no `SANDBOX_TASKS`
entry, so it renders A-04b's generic "Open your sandbox" callout. It is the most tractable of the
seven by some distance — "is `PublicShare.enabled` true for this learner's sandbox project, with
`showCases` on" is a database question with an unambiguous answer, unlike grading a charter or a
Playwright repository. The rest of the note below stands unchanged.

**T5 is now the only track rendering as a "coming soon" card**, and the only remaining `planned()`
stub helper in the content tree is gone from T4 as it was from T2 and T3.

**Seventeenth slice 2026-08-15: T5 opens with `ch1-fundamentals`**, 1 of 7, `draft` — no route, no
sitemap entry, no visible change. `istqb.ts` became a directory, matching T1–T4.

**One lesson, deliberately, for T2's reason rather than T4's:** T5 *is* a chain of a kind — six
chapters in syllabus order plus an exam-strategy closer — and more importantly it is a **new genre**.
The first four tracks teach; this one revises for a paper, and the shape it commits to should be
judged on one chapter before five more are written to it.

**The shape.** Not a first course — the lesson says so in its opening line and points at T1 for the
teaching version. What a chapter lesson is instead: the same material arranged the way the paper asks
about it. Concretely, four things the other tracks' lessons do not do.

1. **It states the chapter's cost and its K-level ceiling up front.** Chapter 1 supplies 8 of the 40
   questions, and every one of its 14 objectives is K1 or K2 — so **no question in this chapter can
   require applying a technique**, and "if you find yourself calculating, you have misread the
   question" is a usable exam instruction rather than a slogan.
2. **It maps the five sections to their objective counts**, which is how a reader decides where to
   spend revision time. §1.4 alone is 5 of 14, and the lesson says to weight accordingly.
3. **It teaches the distinctions rather than the definitions**, because that is what multiple choice
   can test: testing/debugging, QA/testing, error/defect/failure, verification/validation,
   analysis/design, test cases/test procedures, clustering/tests wearing out, role/job title. The
   closing table is that list on one screen.
4. **It ends in a drill, not a summary** — a link to the chapter 1 quiz with a threshold (below 6 of
   8, read the explanations rather than re-read the page).

**Two accuracy decisions worth recording.**

**The exam weight is described as ours, not theirs.** The lesson says chapter 1 supplies "8 of the 40
questions **in our practice paper**". §5.1's warning is still open — the per-chapter split is the one
number in the blueprint with no document behind it — so a lesson that told a reader "chapter 1 is 8
questions of the real exam" would be publishing the guess as fact. Every chapter lesson must use this
phrasing until the owner supplies "Exam Structure Tables" or equivalent.

**§7.3 is a writing constraint, not just a legal one.** Nothing in the lesson reproduces syllabus
wording: the objective topics are paraphrased, the seven principles are given as *what each one
licenses* rather than as their canonical sentences, and the four self-check questions are original
scenarios. The file carries a header comment saying so, which is where a reviewer will look first.

**Verified by temporarily publishing, the same check A-09b used**, because this is the first lesson
in a track carrying `trademarkNotice` and the first whose forward link is an *exam* route rather than
a lesson: with the track flipped locally, `/academy/istqb/ch1-fundamentals` renders the
non-affiliation notice once, and both of its links resolve —
`/academy/istqb/practice-exam/chapter/1` **200s while the track is still `draft`**, because the
chapter-quiz route is gated on the blueprint slug rather than on track status. The flip was reverted
before committing and the route 404s again.

That last fact is the one to remember for the remaining chapters: **a chapter lesson may link to its
own drill safely at any time**, unlike the lesson-to-lesson forward links that caused the 404 hazard
recorded three times above.

**No checker debt added** — T5 has no `sandbox: true` lessons at all. The count stays at seven.

**Eighteenth slice 2026-08-15: T5's `ch2-sdlc` and `ch3-static-testing`**, 3 of 7, still `draft`.
The shape the seventeenth slice proposed is now applied rather than proposed, and it held without
modification: cost and K-level ceiling up front, sections mapped to objective counts, distinctions
table before the drill link.

**Paired because chapter 3 cannot carry a slice alone.** It is 4 of 40 questions and 8 objectives,
most of them short lists — the smallest unit of work in the track. Pairing it with chapter 2 also
puts the two "where testing sits" chapters together: chapter 2 places testing in a lifecycle,
chapter 3 is the half of it that runs before anything executes.

**What the two lessons decided to emphasise, which is the part a reader cannot get from the
objective list.** For chapter 2, that **§2.1 holds 6 of the 10 objectives but §2.2 is where the
marks are lost** — the lesson says to read §2.1 for recognition and §2.2 for precision, because
*level versus type* is the most reliably confused pair in the syllabus. It states the consequence
flatly: **any test type can be applied at any test level**, and a question asserting that
non-functional testing happens only at system level is offering a false statement. For chapter 3,
that the chapter's centre of gravity is what static testing finds that execution cannot — **a
requirement that contradicts itself will pass every test written against it**, because the tests
inherit the contradiction — and that the recurring exam question in §3.2 is simply *who leads which
review type*.

Both lessons carry the caveats the syllabus makes and candidates skip: **shift left costs up-front
effort and needs management buy-in**, DevOps automation **does not replace exploratory and manual
testing**, and **retirement is a maintenance-testing trigger** (archived data has to stay
retrievable), which is the one people forget because decommissioning sounds like the end of testing.

`ch3`'s closing points at chapter 4 by name and warns that it is **the first chapter with K3
objectives** — the first place where a question demands applying a technique rather than recognising
one. That is a real change of gear and worth signposting a chapter early.

**Cross-links, all verified against a running server:** the two drill routes
(`/academy/istqb/practice-exam/chapter/{2,3}`) and the three T1 lessons the chapter-2 lesson leans on
— `sdlc-and-stlc`, `test-levels`, `test-types` — all 200. The pattern established in the seventeenth
slice holds: **drill links are safe at any time**, because the chapter-quiz route is gated on the
blueprint slug rather than on track status, and T1 links are safe because T1 has been published since
A-01.

**Chapters 4, 5, 6 and `exam-strategy` remain.** Chapter 4 is the biggest single piece of writing
left in A-08 — 11 of 40 questions, 14 objectives, and the K3 material — and should get its own slice.

**Nineteenth slice 2026-08-15: T5's `ch4-test-analysis-design` alone**, 4 of 7, still `draft`. The
biggest single lesson in the Academy at 30 minutes, and the one slice in T5 that was always going to
be one lesson: 11 of 40 questions, 14 objectives, and **five K3 objectives — four of them in §4.2**.

**K3 changes what a lesson has to do, and this is the first one that faces it.** K1 and K2 are
answered by recall and explanation, so a chapter lesson can arrange facts and name distinctions. K3
prints material in the question and asks the candidate to *produce* an answer — a value set, a rule
count, a coverage percentage. A lesson that only described the techniques would leave the reader
unable to do the thing they will be asked to do, so §4.2 is built from **worked examples with the
counting rules made explicit**, and the closing advice for this chapter alone is *do not re-read
this — work the four techniques against fresh material until the mechanics are automatic.*

The mechanics it commits to stating precisely, because they are what a K3 question actually turns on:

- **2-value versus 3-value BVA.** For 18–65: 17, 18, 65, 66 against 17, 18, 19, 64, 65, 66. The
  lesson says outright that a question asks for one variant and expects you to have noticed which.
- **One invalid partition per test**, and the *diagnostic* reason — a rejection that could have come
  from either input hides the second defect. Valid partitions may be combined freely.
- **Full coverage of a decision table is one test per rule**, a full table is 2ⁿ columns for *n*
  binary conditions, and **a collapsed table is counted as printed rather than as 2ⁿ**.
- **State diagram versus state table**: valid transitions only against every state–event pair, which
  is exactly the difference a question exploits when it asks for a count.
- **100% branch coverage guarantees 100% statement coverage; the reverse never holds** — carried by
  a four-line `if` with no `else`, where one test gives 100% statements and 50% branches. This is
  the most examined fact in §4.3 and the lesson gives it its own display quote.

Two limits are stated as flatly as the mechanics: **white-box testing cannot find a requirement that
was never implemented** (there is no code to cover), and **exploratory testing is not ad hoc
testing** — chartered, time-boxed, documented. The checklist-based weakness is labelled as chapter
1's *tests wear out* principle in different clothing, which is the cross-chapter link the exam
rewards.

**§4.5's K3 objective is easy to under-serve and was not.** ATDD is not a vocabulary item here: the
lesson derives a test set from one Given/When/Then criterion and shows that derivation produces
**positive and negative tests** and surfaces the ambiguity in "over 50" before any code exists —
chapter 3's argument for static testing, arriving from the other direction.

**Verified against a running server**, including a temporary publish because this is the first T5
lesson with a fenced code block and unicode mathematics: the page renders with the non-affiliation
notice once, the code block and the `2ⁿ`/`⇒`/`÷` characters survive `<Markdown>` intact, and all
five links resolve — the chapter 4 drill plus the four T1 technique lessons it hands off to. The flip
was reverted before committing and the route 404s again.

**Chapters 5, 6 and `exam-strategy` remain.** Chapter 5 has the most objectives of any chapter in the
syllabus (16) and should get its own slice; chapter 6 (2 of 40) and `exam-strategy` pair naturally as
the slice that publishes the track.

**Twentieth slice 2026-08-15: T5's `ch5-managing-test-activities` alone**, 5 of 7, still `draft`.

**The chapter with the worst ratio in the syllabus, and the lesson says so in its first paragraph:**
9 of 40 questions across **16 objectives**, more ground per mark than anywhere else. That is a
revision instruction, not trivia — it means recognition beats depth here, and it is why the drill
advice at the end is *check which section your misses come from*, since a wrong answer in this
chapter usually means a topic never read rather than one misunderstood.

**Its three K3 objectives are scattered**, unlike chapter 4's cluster — estimation and prioritisation
in §5.1, the defect report in §5.5 — so the lesson gives each its own worked treatment:

- **Three-point estimation with the arithmetic done**: E = (a + 4m + b) ÷ 6, SD = (b − a) ÷ 6, worked
  through 8/12/28 → 14 ± 3.33. The lesson names what the weighting is *for* — the most likely value
  counts four times, so a pessimistic outlier moves the answer far less than a plain average, which
  is also the distractor a question offers.
- **Prioritisation with its override**: risk-, coverage- and requirements-based ordering, and then
  **dependency wins regardless of priority**. A question that lists priorities *and* a dependency is
  testing whether the second was noticed.
- **The defect report as production, not recognition**, since K3 means writing one.

**Three distinctions carry most of the chapter's marks and are stated as flatly as possible.**
Entry versus exit criteria, with **"the schedule ran out" named as an invalid exit criterion** — a
common reason to stop and explicitly not the same thing. **Severity versus priority**, with the
example that runs both ways (a typo everyone sees is low severity and high priority; a crash three
customers a year could hit is the reverse). And **project versus product risk**, with a rule of thumb
the syllabus does not give but the exam rewards: *if the harm would show up in the delivered
software it is a product risk; if it would show up in the plan it is a project risk.*

**The pyramid and the quadrants are separated deliberately**, because both are diagrams about
organising tests and that is exactly why they get confused: **pyramid = how many at which level;
quadrants = what for, and whose audience.**

This is the most cross-linked lesson in T5 — four T2 lessons (`test-planning`, `risk-based-testing`,
`metrics-that-mean-something`, `reporting-to-stakeholders`) and two T1 ones (`bug-reports`,
`defect-lifecycle`), all verified 200 alongside the chapter 5 drill. That density is a property of
the chapter rather than a choice: management is the material T2 already teaches as practice, so the
exam lesson's job is to name what is examinable and hand off the working version.

**The checker-debt note above was recounted in this slice and corrected from seven to eight** — see
the recount box there. `test-planning` had carried `sandbox: true` since A-08's first slice and was
never in the tally.

**Twenty-first slice 2026-08-15: T5's `ch6-test-tools` and `exam-strategy`, and the track published
at 7 of 7.** The fourth A-08 slice with a visible change, and the last content slice of the Academy's
English build-out: **eight new routes, eight new sitemap entries, and the fifth roadmap card becoming
a link — there is now no "coming soon" card left on `/academy` at all.**

`ch6-test-tools` is the smallest lesson in the track and says so, then argues against skipping it:
2 of 40 questions is 5% of a paper with a 65% pass line, from **two objectives**, which makes it the
cheapest chapter in the syllabus per mark. Its two load-bearing points are that **a tool is not
necessarily a testing product** — a spreadsheet building a decision table is tool support in exactly
the sense meant — and that the benefits and risks of automation are **two lists a question mixes on
purpose**, of which the two worth memorising are that maintenance effort is routinely underestimated
and that a tool can replace thinking rather than support it.

**`exam-strategy` is the one T5 lesson with no syllabus objective behind it**, so its content
discipline is different: everything in it is either a fact about *our* practice paper, verified
against the code, or general technique.

- **The timing argument is arithmetic, not advice.** 90 seconds is the average and nobody should
  pace that way: K1 costs 20–30 seconds, K3 costs two to three minutes, so **bank time on recall and
  spend it on application**. And the slow questions are locatable in advance — every K3 objective in
  the syllabus is in chapters 4 and 5, which in our blueprint are 20 of the 40 questions. *Half the
  paper is the two chapters holding all the calculation.*
- **Two grading facts were read out of `exam-core.mjs` rather than assumed**: multiple-response
  questions are graded as an **exact set with no partial credit** (`want.length === got.length &&
  every`), and there is **no negative marking** — a wrong answer and a blank both score zero. That
  second fact is what makes "every unanswered question gets an answer" the first move of the last ten
  minutes rather than a platitude.
- **The absolutes tell** — `always`, `never`, `only`, `guarantees`, `proves` — is given with its own
  exception, because the syllabus does contain one famous guarantee: 100% branch coverage implying
  100% statement coverage. A rule of thumb that cannot name its exception teaches a wrong answer.

**§5.1's open item is handled in the lesson text, not hidden by it.** `exam-strategy` states plainly
which numbers match the published exam structure (question count, duration, extra time, pass mark)
and that **the per-chapter split is this project's own blueprint** rather than a published figure —
"a reasonable approximation, and not a quotation". That is the same honesty the chapter lessons carry
in their "in our practice paper" phrasing, said once in full where a reader planning their revision
will meet it.

> **Overtaken 2026-08-18, and the lesson now says the opposite.** The *Exam Structure Tables*
> document arrived and the split turned out to be the published one, so "our approximation" was the
> inaccurate sentence on the page — an over-hedge rather than an over-claim, which is the safer way
> round to be wrong and still wrong. `exam-strategy` now carries the full published table with its
> K-level columns and one narrower honesty in its place: our draw matches the chapter counts, not
> the K columns. See §5.1.

**Verified against a running server, and this is the widest check A-08 has run**: all 8 T5 routes 200
with 8 sitemap entries; **all five roadmap cards are now links and `border-dashed` appears zero times
on `/academy`**; the non-affiliation notice renders on a T5 lesson page and **not** on a T2 one, which
is `trademarkNotice` scoping proven rather than assumed; no console errors. And the `](/academy/`
sweep was run as an actual request per link rather than by eye — **24 distinct cross-links across all
five tracks, every one 200**, including the seven `/academy/istqb/practice-exam*` links the T5
lessons introduced.

> **A-08's routing half shipped 2026-08-18 — `/id/academy/**` is live, and the translation is now
> the only thing left in this work order.** The gate A-03 set (a measured Indonesian organic-traffic
> number) was lifted by the owner, who asked for all 51 lessons translated. That is a content job the
> size of A-08's English half, so it lands the same way: one track per slice. This slice built
> everything that makes those slices mechanical.
>
> **What shipped.**
>
> - **Three `/id/academy/**` routes**, and the three English ones rewritten to call the same
>   components (`RoadmapPage`, `TrackPage`, `LessonPage`). Two copies of these pages would have
>   doubled every future change to them and made "the Indonesian one drifted" a normal kind of bug.
>   `lang` decides three things and nothing else: which text, which lessons are visible, and where
>   links point.
> - **A parallel `translations/id` tree, not the `{ en, id? }` field shape A-03 sketched.** That
>   shape was proposed when there were 13 lessons and no Indonesian text; at 51 lessons and 578 KB it
>   would make every English edit diff against a file twice its size and teach ~40 call sites to
>   resolve. The parallel tree leaves the English files — the source text — untouched by a
>   translation slice, and makes "which lessons are translated" a set the sitemap and `hreflang` are
>   derived from. Recorded as a deviation, with its reason, in `src/content/academy/types.ts`.
> - **A translation cannot move an answer key.** `QuestionTranslation` has no `correct` field;
>   `localiseQuestion` merges translated wording onto the *English* question's own flags, by id. The
>   same move as A-02's `server-only` boundary — make the class of error unrepresentable rather than
>   reviewable. `academy-bundle-check` still reports 0 leaks with the new path in place.
> - **The fallback policy is 404, not the English body.** An untranslated lesson has no `/id` route
>   at all. Serving English text at an Indonesian URL is duplicate content under a second path, which
>   is the precise thing `hreflang` exists to prevent, and it would make these routes worth less than
>   not having them. The roadmap says so out loud instead: an untranslated track gets a
>   "Belum diterjemahkan" card linking to the English one, because hiding it would tell an Indonesian
>   reader the Academy is one track big.
> - **`hreflang` is claimed only where the sibling exists.** `bilingual(path, translated)` returns a
>   bare canonical when it does not. A dead `hreflang="id"` is worse for the English page than no
>   alternates at all, and *most pages are in that state for most of this roll-out* — which is why
>   the flag is a parameter rather than an assumption.
> - **The language switch is a link, not the `tf_lang` cookie.** A cookie is invisible to a crawler;
>   that limitation is exactly what A-03 deferred to this work order.
> - **`scripts/academy-i18n-check.mjs`**, wired into `prebuild`. Seven assertions, every one of them
>   a failure mode that *ships a page* rather than erroring: a typo'd slug translates nothing, a
>   renamed choice id silently falls back to English for one option, a copied `/academy/` link drops
>   the reader out of their language mid-sentence, an untranslated track title looks finished. Each
>   was proved to fail by breaking it and watching the build stop.
> - **Register is `Anda`** (owner's decision, 2026-08-18) — deliberately unlike the rest of the
>   product's Indonesian copy, which says `kamu`. Academy lessons are long-form instructional prose
>   read by working adults preparing for a certification or an interview. Both halves are build
>   assertions, because `Anda` is a proper pronoun that is capitalised mid-sentence and English `you`
>   is not: the first draft of the first lesson had 15 lowercase `anda` in it, and it rendered
>   perfectly. *Extended 2026-08-23 (audit WP-3)*: the `-mu` clitic family — `dirimu`, `milikmu`,
>   `padamu`, `kau` and the rest — is the same register wearing a suffix, and it outlived the
>   original `kamu` rule by a year. Now asserted alongside it.
> - **Terminology is decided once, in [`docs/ACADEMY-ID-GLOSSARY.md`](ACADEMY-ID-GLOSSARY.md)**
>   (audit WP-3, 2026-08-23). Fifty-one lessons written across several PRs had translated *bug
>   report* three different ways, none of them wrong Indonesian — which is why nobody caught it:
>   a reviewer reads one lesson, and the split only exists across the tree. The glossary records
>   the canonical form per concept and the reason; `academy-i18n-check.mjs` holds the retired
>   spellings retired. Add a term to it only once the tree has actually spelled it two ways.
> - **`lang` is marked on the page subtree, not `<html>`.** The root layout cannot see the pathname
>   without middleware, and this app has none; introducing one for an attribute would put code in
>   front of every request in the product. `lang` on a subtree is what HTML5 defines for exactly this.
>
> **Verified against a running server**: all six routes 200 with correct canonicals; reciprocal
> `hreflang` on the translated pair and *none* on `/academy/manual-pro`; three untranslated `/id`
> paths 404; the sitemap's Indonesian URLs are exactly the translated ones and every one resolves.
> Two real bugs the console caught and this fixed: `<a>` nested inside `<a>` (the shared public
> chrome wrapped `Logo`, which renders its own link) and `<html lang="en">` on Indonesian pages.
> **TC-E2E-133**–**136**; full `academy.spec.ts` green at 45 specs.
>
> **Translation progress: 1 / 51.** `academy-i18n-check` prints the count on every build, so the
> number in this document cannot drift the way the sandbox-checker tally did (A-11a's lesson).

**A-08's content half is done.** Five tracks, 51 lessons, all `published`. What remains under this
work order is the Indonesian routes — `/id/academy/**` with `hreflang` and translated lesson bodies —
which A-03 deliberately gated on measured ID organic traffic rather than deciding up front, and the
sandbox checkers, which every slice since the third has argued belong in their own work order.

> **Translation slices, 2026-08-18 → 2026-08-19: 51 / 51, and A-08 is closed.** Five slices, one
> track each, in roadmap order: T1 (13), T2 (12), T3 (12), T4 (7), T5 (7). Every published lesson
> now has an Indonesian sibling, so `getVisibleLessons` no longer intersects down to a subset and
> the "Belum diterjemahkan" card the roadmap was built to render has nothing left to render.
>
> **What the completion changes, beyond the word count.** `hreflang` was a parameter precisely
> because most pages had no sibling for most of the roll-out; now the reciprocal pair is claimed on
> every Academy page in both languages, and the sitemap carries **57 Indonesian URLs against the
> English 57** rather than a handful. The 404-not-fallback policy is unchanged and now unreachable
> for lessons — which is the point: it was never a stopgap, it was the rule that made a partial
> translation safe to ship.
>
> **The one thing not translated, and why it is a code span rather than a link.** The exam
> simulator — `/academy/istqb/practice-exam` and the six chapter quizzes — is English-only; A-08's
> routing half built no `/id` equivalent, and A-06's question bank has no `QuestionTranslation`
> path. T5's seven lessons each ended by linking to their chapter quiz, and neither available link
> was honest: an `/academy/…` markdown link is what `academy-i18n-check`'s rule 3 forbids (it drops
> the reader out of their language mid-sentence), and an `/id/academy/istqb/practice-exam/chapter/1`
> link would 404, because `[track]/[lesson]` cannot match four segments. So the pointer is the path
> in a code span with a sentence saying the simulator is in English. A reader can still reach it;
> nothing pretends it was translated. Localising the bank is a work order, not a slice.
>
> **Register held across 578 KB.** `Anda`, capitalised, and no `kamu`. The check passed on every
> one of these five slices, which is the outcome an assertion is for rather than evidence it was
> unnecessary — the first lesson written to this register had 15 lowercase `anda` in it and
> rendered perfectly, and that is still the only reason anyone would know. Slugs stayed English
> throughout, so every `hreflang` claim is a claim about the same page.
>
> **Verified against a running server, and this is the widest sweep the work order has run.** All
> **51** Indonesian lesson routes 200, requested individually rather than sampled; all five
> Indonesian track pages and the roadmap 200; **17 distinct `/id/academy/…` cross-links** extracted
> from the translated bodies and each requested — every one 200; reciprocal `hreflang` and correct
> canonicals on the pairs checked in both directions; the Indonesian ISTQB notice rendering on a T5
> lesson; no console errors. And the self-check was graded in the browser on an Indonesian page:
> answers submitted, **explanations returned in Indonesian**, which is the `gradeSelfCheck` path
> the second slice fixed and the check has asserted since. `next build` compiles, and
> `academy-bundle-check` still reports **0 leaks** across 564 explanations.
>
> **Three specs went red on completion, which is the suite working.** `TC-E2E-134`–`136` were
> written against the *partial* state and asserted it precisely: three paths 404, a bare canonical
> on `/academy/manual-pro/test-planning` because it had no sibling, and a "Belum diterjemahkan"
> card on the roadmap. All three are false now, and all three failed before this slice touched
> them — a suite that had stayed green through a change this size would have been telling us
> nothing. They now assert the guarantee that replaced them: **sitemap parity** (every English
> lesson URL has an Indonesian one at the same slug, compared as sets rather than counts),
> reciprocity in both directions on a lesson from each of the five tracks, and every roadmap card
> linking into `/id`. The 404 gate keeps its coverage through an unknown slug, which is the part of
> the fallback still reachable from content — the branch returns to content coverage the day an
> English lesson lands ahead of its translation, which is the normal way the next one will arrive.
> Full `academy.spec.ts` green at **45 specs**.
>
> **Two lines of roadmap copy had been false since 2026-08-15 and this fixes them.** The header said
> *"51 lessons available now · more tracks in progress"* and the beta banner said *"One track is
> finished; the rest are still being written"* — both written when T1 was the only published track,
> and both left behind when T5 published four days earlier. The translation reproduced them
> faithfully into Indonesian, which is how they were noticed: a false claim is easier to see when
> you have to write it twice. Neither is replaced with a new count. Copy that asserts how many
> tracks exist goes stale the next time one is added, and the roadmap already shows per-track status
> from `status` where it cannot drift; the clauses are simply removed, leaving *"51 lessons
> available now"* and *"Published lessons may still change."* The BETA badge and the GitHub link
> stay — that is a product claim about the Academy, not a fact about the track list, and it is the
> owner's to make.

> **A track flips to `published` when *all* of its lessons are.** `getTrack()` filters on the
> *track's* status, so the lesson-level status is what let the writing land in five reviewable
> pieces without a reader ever seeing a half-finished listing. The rule the next track inherits:
> lesson status is for landing work, track status is for the promise on the roadmap card.
>
> **Debt, now at eight hands-on lessons with no checker.** `test-planning`, `exploratory-testing`,
> `api-testing`, `metrics-that-mean-something`, T3's `first-playwright-test` (eighth slice),
> `ci-github-actions` and `junit-to-testforge` (eleventh), and T4's `portfolio` (sixteenth) all carry
> `sandbox: true` and no `SANDBOX_TASKS` entry, so all eight
> render A-04b's generic "Open your sandbox" callout instead of a "Start this exercise" button.
> That degradation is deliberate and it works — and every one of them is shipped in a *published*
> track (four in T2, three in T3, one in T4), which raises the priority again without changing
> the shape.
>
> > **Recount 2026-08-15, twentieth slice.** This note said six, then seven, and both were wrong:
> > `test-planning` has carried `sandbox: true` since the *first* A-08 slice and was never counted,
> > because the debt tally started at the third slice with the two it introduced. Counted from the
> > source rather than from this paragraph: 13 lessons carry `sandbox: true`, `SANDBOX_TASKS` has 5
> > keys (all T1), so the debt is **8**. The lesson for whoever writes the checker work order is that
> > a number maintained by addition drifts — derive it, or assert it in `academy-checks-selftest`.
>
> The five T1 checkers all grade the *shape of a case
> row*; these grade a charter, a Postman collection, a dashboard argument and a Playwright
> repository on the learner's own machine, none of
> which is a DB row with fields to inspect. **That is a design question, not a writing task**, and it
> should get its own work order rather than being smuggled into a content slice — including the
> honest possibility that some of them are better self-assessed against published criteria than
> machine-checked.
>
> > **Superseded 2026-08-15 by A-11, which re-read the schema instead of this paragraph.** The claim
> > above is **wrong for six of the eight**: `Session`/`SessionNote` (charter, timebox, status, note
> > kinds, and what each note was converted into), `TestPlan`, `Dashboard`/`DashboardWidget`,
> > `TestRun` and `PublicShare` all exist and are as inspectable as a case row. Only `api-testing`
> > and `first-playwright-test` are genuinely off-platform. This deferral was written once and quoted
> > forward through nine slices without anyone re-opening `schema.prisma`.
>
> **The two CI lessons are the part with an obvious mechanism, and the eleventh slice specified it
> without building it.** Both produce a run in the sandbox project through `/api/v1/junit`, which
> *is* inspectable: `ingestResults()` already returns `matched`, `unmatched` and a pass/fail summary,
> and the run is a `TestRun` row against the learner's own sandbox. What the work order still has to
> decide is the pass bar — any run at all, a run with at least one *matched* case, or a matched run
> that is also green — and the last is a trap, because the capstone's exercise deliberately asks the
> learner to produce a 422 and a failing result on the way. Grading on "green" would fail the
> learner for following the instructions.
>
> > **Decided 2026-08-15 in A-11:** the bar is **a run with at least one *matched* case**. "Any run"
> > passes a 422 that matched nothing; "green" punishes following the instructions.

#### A-08a — The two language systems, joined `[x]`

> **Status: DONE** (2026-08-21, branch `fix/academy-language-persists`, issue #226). Reported by the
> owner in the words that name the symptom better than any of the analysis below:
> *"saat di academy bahasa selalu berubah ke english saat ganti page atau refresh."*

**A-08 left the site with two language systems and nothing joining them.** The Academy's language
became a property of the *path* (`/id/academy/**`) — for the good reason recorded above, that a
cookie is invisible to a crawler. Everything else on the public site — landing, login, signup,
password reset, the self-hosting doc — kept rendering from the `tf_lang` cookie. Neither one could
see the other, so **every crossing between them reset the reader**, in both directions:

- Switch the site to Indonesian on the landing page, click *"Buka QA Academy"* → English. All four
  Academy entry points were hard-coded `/academy`. A-03 wrote them when that was the only Academy
  there was and translated their *labels*; A-08 built `/id/academy/**` and never came back for their
  *destinations*. And once there, refreshing could not recover it — past that link the path decides,
  which is exactly why the report says "atau refresh".
- Arrive on an Indonesian lesson from a search result, click *"Masuk"* → an English login page. The
  reader had been reading Indonesian for twenty minutes and the auth pages had never heard of it.
- The signed-in sidebar's Academy link had the same hard-coded `/academy`, so a logged-in reader
  working through the Indonesian Academy was returned to the English roadmap.
- The landing page's five Academy track cards read `track.title`/`track.level` straight off the
  English tree. All five titles have been translated since A-08 closed, so on an Indonesian landing
  page these cards were the one English block in the middle of translated copy.

**The fix is three moves, and none of them touches A-08's routing decision.**

1. **Entry points lead into the reader's language** — `academyPath(lang)` in place of a literal
   `/academy`, on the landing page's four links and the signed-in sidebar's one. This is A-03's own
   rule ("only the entry points are translated") finally applied to where they *point* rather than
   only what they say. The sidebar label stays English per §0.5; "My progress" stays English too,
   because `/id/academy/me` does not exist and pointing it at one would trade an English page for a
   404.
2. **An explicit choice is remembered** — `AcademyLanguageLink` writes `tf_lang` on click. The href
   is untouched, so a crawler (which never fires `onClick`) still sees the same two URLs and the
   `hreflang` claim is unchanged. The cookie is for the half of the site that is not the Academy.
3. **Reading an `/id` URL counts as a choice** — `AcademyLangMemory`, a null-rendering client
   component on the three Academy pages. **Only `id` is ever written, and the asymmetry is the
   design, not an omission**: reading `/id/...` is always evidence of a preference, while reading
   `/academy` is just the default path, and writing `en` there would silently undo a deliberate
   choice — the same bug in the other direction.

**A bundle regression this introduced, caught by the build and fixed before it shipped.** The three
components that write the cookie are all *client* components, and `LANG_COOKIE` lived in
`src/lib/i18n.ts` — the landing/auth dictionary, both languages. Importing six characters of that
module pulled the whole thing into every Academy page's client bundle; `grep` for one landing string
found it in all six Academy chunks. Selection now lives in **`src/lib/lang.ts`** (the cookie name,
`Lang`, `resolveLang`, and one `setLangCookie` shared by all three writers), with `i18n.ts`
re-exporting it so server callers are unchanged. Same split, same reason, as
`src/lib/academy/chrome.ts`. Re-verified: zero Academy client chunks carry the dictionary, and
`academy-bundle-check` still reports 0 leaks.

**`academy-i18n-check` gained rule 7** — no hard-coded `href="/academy"` in the landing page or the
sidebar. It is the only thing that catches this class: both links rendered perfectly and their
labels were correctly translated, so there was nothing for review or a type to notice. Proved by
reintroducing the bug and watching the build stop, per this file's standing rule.

**Verified against a running server, in both directions.** Cookie `id` → all four entry points read
`/id/academy` and the track cards read *"Dasar-Dasar QA"*; cookie cleared → arriving on an
Indonesian lesson leaves `tf_lang=id` and `/login` renders *"Belum punya akun?"*; cookie `en` on
`/academy` is **not** overwritten; and the English switch still gets a reader out — cookie back to
`en` and staying there, which is the one way this could have stranded someone. **TC-E2E-137** covers
all three, and was proved to fail against each half of the fix separately. `academy.spec.ts` green
at **46 specs**; `help-center`, `seo` and `responsive` green.

> **Two failures that are not this change**, both confirmed on a clean `main` in the same checkout:
> `TC-E2E-117` (the certificate share-card request) and `next build`'s `/opengraph-image` prerender,
> which is `@vercel/og` calling `fileURLToPath` on a Windows path containing a space. Same root
> cause, local to this machine. `next build` reports **Compiled successfully** and types valid.

### A-09 — Session-aware shell on `/academy` and `/docs/help` `[x]`

> **Status: DONE** (2026-08-12, branch `feat/academy-help-authed-shell`). Follow-up to A-03: that
> work order gave Academy (and Help, which shares its placement — A-03's rationale, §"Academy sits
> with Help") standalone public chrome, same shape as a marketing page. A user raised a fair
> objection: click **Academy** from inside the app and the whole shell — sidebar, project list,
> search — disappears, replaced by a disconnected-looking page with its own header. Every other
> in-app destination stays inside the shell; Academy and Help didn't.

**Why they couldn't simply move into the `(app)` route group:** that group's `layout.tsx` calls
`requireSession()`, which redirects an anonymous visitor to `/login` before any page under it can
render. Academy and Help are deliberately readable without an account (A-03 §1) and need to stay
indexable by search engines — both requirements a hard login gate breaks. Next.js route groups are
also transparent to the URL, so `src/app/academy/page.tsx` and a hypothetical
`src/app/(app)/academy/page.tsx` would collide on the same `/academy` path — two real files can't
both own one route.

**What shipped instead:** the sidebar/`AppShell` wiring that used to live only in
`src/app/(app)/layout.tsx` was extracted into `src/components/AuthedAppShell.tsx`, a server
component taking `{ session, children }`. `(app)/layout.tsx` now just calls `requireSession()` and
renders it — zero behavioural change for every existing in-app route. `src/app/academy/page.tsx`
and `src/app/docs/help/page.tsx` stayed outside the `(app)` group (so a session is optional, not
required) but now call `getSession()` — the existing non-redirecting lookup, already used
elsewhere — and branch: signed in renders `<AuthedAppShell>` around the same content, so the page
is indistinguishable from any other in-app destination; signed out renders the original standalone
chrome, with its "Back to app" link swapped for **Log in** / **Sign up**, since a guest was never
"in the app" to begin with. The SEO metadata (`robots`, `Course`/`ItemList` JSON-LD, sitemap entry)
is unchanged either way — it's a `<head>` concern set once per page, independent of which shell
wraps the body.

**Cost paid knowingly:** reading `getSession()` reads the session cookie, which forces both routes
to dynamic rendering (`export const dynamic = "force-dynamic"`) — `/academy` was previously
prerenderable and is not anymore. Traffic is low enough in beta that this wasn't worth the
alternative (a middleware rewrite to two physically separate route files, which would have kept
static generation for the guest path at the cost of a second shell implementation to keep in sync).

**Deliberately out of scope:** track pages (`/academy/[track]`), lesson pages
(`/academy/[track]/[lesson]`), and Help topic pages (`/docs/help/[slug]`) keep their existing
standalone reading-mode chrome. Only the two index/landing pages changed — that's where the
disconnect was actually felt (an in-app user landing on an unfamiliar page), and it keeps this
change reviewable instead of touching Academy's entire route tree.

**Verified:** **TC-E2E-109** (signed-in visitor at `/academy` sees `app-sidebar` and `nav-academy`,
no Sign up link), **TC-E2E-110** (guest at `/academy` sees Log in/Sign up, no `app-sidebar`),
**TC-E2E-111**/**TC-E2E-112** (same pair for `/docs/help`). Full regression: all of
`e2e/academy.spec.ts` and `e2e/help-center.spec.ts` (25 specs) pass together; `tsc --noEmit`,
`eslint`, and `next build` are clean, and `next build`'s route table confirms `/academy` and
`/docs/help` moved from prerendered to `ƒ` (dynamic), as expected.

### A-09b — The same shell, one level deeper `[x]`

> **Status: DONE** (2026-08-14, branch `fix/academy-help-shell-subpages`). A user reported that
> `/academy/fundamentals` loses the navigation panel while `/academy` keeps it. That is precisely
> the boundary A-09 drew and wrote down: it fixed the two index pages and left "track pages, lesson
> pages, and Help topic pages" on standalone reading chrome, on the argument that the disconnect was
> only felt on the landing pages. It wasn't — clicking a track from inside the app crosses the same
> line one click later, and the audit that followed found the same break on `/academy/me` and
> `/academy/sandbox`, both linked directly from the sidebar's own Academy group.

**What shipped:** the A-09 branch (`getSession()` → `<AuthedAppShell>` for a session, standalone
chrome with Log in/Sign up for a guest) applied to `/academy/[track]`, `/academy/[track]/[lesson]`
and `/docs/help/[topic]`. `/academy/me` and `/academy/sandbox` already call `requireSession()`, so
a session is guaranteed there and they render the shell unconditionally — no guest branch to
mirror. `AuthedAppShell` was already the single implementation, so nothing was duplicated; the
page bodies are unchanged and simply moved inside whichever wrapper applies.

**Cost paid knowingly, and it is larger than A-09's.** Reading the session cookie forces dynamic
rendering, so `/academy/[track]`, `/academy/[track]/[lesson]` and `/docs/help/[topic]` lost their
`generateStaticParams` prerender — 1 track, 13 lessons and 9 help topics that used to build as
static HTML. A-01 called static "the point" for these routes, and unlike `/academy` they carry real
indexable content, so this was put to the product owner rather than assumed: the alternative
(middleware rewriting signed-in visitors to a parallel dynamic route, keeping the static file for
guests and crawlers) preserves the prerender at the cost of two route files per URL and a
middleware hop. It was declined in favour of matching the precedent already set. The pages are
still server-rendered in full on every request — what is lost is the prerender and the CDN cache,
not the HTML a crawler receives. Next 14.2 has no PPR, which is the option that would have made
this free; revisit on a Next 15 upgrade.

**`dynamicParams = false` is gone with it** — it cannot coexist with `force-dynamic`. It was never
what produced the 404 for a draft or unknown slug: `getTrack()` / `getLesson()` / `getHelpTopic()`
already return undefined and the pages already call `notFound()`. The behaviour is identical, now
evaluated per request rather than against a build-time list. `allLessonParams()` in
`src/content/academy/index.ts` existed only to feed `generateStaticParams` and was deleted.

**Verified:** **TC-E2E-121**–**125** (signed-in and guest on a track page, signed-in and guest on a
lesson page, and the two session-only pages) and **TC-E2E-126** (guest on a help topic). The guest
cases assert the content still renders, not just the chrome — losing the prerender must not mean
losing what a crawler comes for. **TC-E2E-27** was updated: it used to click the topic page's "Back
to app" link, which a signed-in reader no longer has, and now leaves via the sidebar. Full
regression: `e2e/academy.spec.ts` + `e2e/help-center.spec.ts` 39/39, `tsc --noEmit` and `eslint`
clean, and `next build`'s route table confirms all three routes moved from `●` (SSG) to `ƒ`
(Dynamic).

### A-09c — The session reaches the page body, not just its frame `[x]`

> **Status: DONE** (2026-08-23, issue #230, branch `fix/academy-signup-cta-230`). A user reported a
> button on the Academy pointing at `https://testforge.emha.space/signup` while they were already
> signed in.

**What A-09 and A-09b actually established** was that every Academy route reads `getSession()` and
uses it to choose a *frame*: `AuthedAppShell` for a session, the public chrome (which is where the
Log in / Sign up pair legitimately lives) for a guest. What neither work order said out loud is that
the CTAs planted inside the page **body** are a second, independent decision — and one of them was
never made.

**The one that was missed** is the hands-on exercise callout on a lesson page. In `LessonPage.tsx`
the `session` that the file reads at the top was used exactly once, hundreds of lines later, to
pick the shell; the callout itself is guarded only by `{lesson.sandbox && …}`, and its `/signup`
link sat *outside* the `sandboxTask ? … : …` ternary, so it rendered for every reader of a hands-on
lesson, in both languages, signed in or not. The link is not junk — `openSandboxTask` calls
`requireSession()`, so it is the polite version of the redirect an anonymous reader would hit by
pressing "Start this exercise" next to it. It is simply the wrong sentence to show someone who
already has an account. `RoadmapPage` gates its equivalent line with `{!session && …}`, which is
what makes this an oversight rather than a decision. The fix is that same guard; nothing else in the
callout is gated, because the exercise itself is identical for both audiences.

**Two things that look like the same bug and are not**, recorded so the next audit stops where this
one did:

- `ExamRunner`'s "Save this attempt — sign up" is a client component with no session prop, which
  reads like the identical mistake. It is unreachable while signed in: `submitExamAction` writes an
  `ExamAttempt` and returns `attemptId` whenever a session exists, and the runner then navigates to
  `/academy/istqb/practice-exam/[attemptId]` rather than falling through to the inline result. So
  **reaching `phase === "result"` in-page implies the submitter was anonymous** — an invariant worth
  a comment, which it now has, rather than a prop that would only pretend to add safety.
- **The ISTQB exam sub-tree keeps its own standalone chrome** (`Logo` + a back link) and reads no
  session at all, so a signed-in reader gets no sidebar on `/academy/istqb/practice-exam` or its
  chapter quizzes — the one place A-09b's rule does not reach. Left alone deliberately:
  `.../practice-exam/[attemptId]` is session-*only* and wears the same bare chrome, so the sub-tree
  is internally consistent and reads as a distraction-free exam room rather than a gap. Pulling it
  into the shell would also cost the chapter quizzes their prerender (`dynamicParams = false` cannot
  coexist with `force-dynamic` — A-09b) for no bug. Open as a product question, not a defect.
  **Closed as a defect by the owner on 2026-08-23 — see A-09d.**

**Verified:** **TC-E2E-138** — the callout's `/signup` link present for a guest in both languages,
absent for a signed-in reader in both, with "Start this exercise" still there. The link check is
scoped to the callout rather than the page: the signed-out header carries its own Sign up button, so
a page-wide assertion would pass for the wrong reason in one half and fail in the other.

### A-09d — The exam sub-tree joins the rest of the Academy `[x]`

> **Status: DONE** (2026-08-23, branch `fix/academy-exam-frame`). The owner asked why
> `/academy/istqb/practice-exam` "looks different from everything else". It did, in five separate
> ways, and A-09c had recorded four of them as a deliberate exception (above) rather than a defect.
> That call is now reversed: the exam room is a page of the Academy, and a reader crossing into it
> from the roadmap should not feel they have left the site.

**What was different**, all of it inherited from A-06 and untouched by A-09b and A-12:

| | The rest of the Academy | The three exam routes (before) |
|---|---|---|
| Column | `ACADEMY_SHELL` — 65rem | `max-w-3xl` — 48rem |
| Signed-in frame | `AuthedAppShell` (sidebar, command palette, coach) | none — the bare page, for everyone |
| Signed-out frame | `AcademyPublicChrome` (Log in / Sign up) | a hand-rolled `Logo` + "Back to …" header |
| Where you are | ruled mono breadcrumb | nothing; the back link had to say it |
| Type scale | A-12's — h1 34/40px display, body 15px | A-06's — h1 24/30px, body 14px |

**What shipped:**

- **`AcademyFrame`** (`src/components/academy/Frame.tsx`) — the session→frame choice A-09/A-09b
  established, as a component instead of a tail copied into three page files. All six Academy
  surfaces now end with it, so "every Academy page picks its frame from the session" is one file to
  read rather than six to compare. This is the actual fix: the sub-tree drifted because there was
  nothing to drift *from*.
- **`AcademyCrumbs`** (`src/components/academy/Crumbs.tsx`) — the ruled breadcrumb the track and
  lesson pages open with. It replaces the back link rather than deleting it: inside the shell a
  standalone `Logo` is a second logo, but the way out of the exam still has to exist, and a
  breadcrumb is the same navigation in the vocabulary the rest of the Academy already uses.
- The three pages keep every word of their content, their `data-testid`s, and the exam engine
  untouched. What changed is the frame around them and the type scale inside them.

**Cost paid knowingly, and it is A-09b's exactly.** The chapter quizzes lose their prerender:
reading the session forces dynamic rendering, `dynamicParams = false` cannot coexist with
`force-dynamic`, and both are gone with `generateStaticParams`. Six pages that used to build as
static HTML are now rendered per request. The 404 for a seventh chapter is unaffected — it never
came from `dynamicParams`, it comes from `findQuiz()` returning undefined and the page calling
`notFound()`, which now happens per request instead of against a build-time list. `/academy/istqb/
practice-exam` was already dynamic in everything but the Next sense; it now says so with an
explicit `export const dynamic = "force-dynamic"`.

**The exam-room argument, answered rather than dismissed.** A-09c's defence of the bare chrome was
that a distraction-free page is right for a timed exam. That is a good argument about the *taking*
of an exam and a bad one about the page you land on from search, or the result page you read
afterwards — and it was being applied to all three. If focus during the 60 minutes turns out to
matter, the place to solve it is `ExamRunner`'s `phase === "taking"`, which already owns the screen,
not the route's frame.

**Verified:** **TC-E2E-139** (signed-in: the sidebar on the full paper, on a chapter quiz, and on
the attempt page reached by actually taking a quiz) and **TC-E2E-140** (guest: public chrome, the
blueprint still rendered on both indexable routes, and chapter 7 still a 404). Full regression:
`e2e/academy.spec.ts` 45/49 — the four reds are `main`'s and not this branch's: **TC-E2E-117** is
the local-only `@vercel/og` font failure, and **TC-E2E-100/101/131** fail identically on a clean
checkout (confirmed by stashing this branch and re-running them). `tsc --noEmit` and
`next lint` clean.

### A-10 — Exam integrity: answer-key balance, single-use tickets, resumable attempts `[x]`

> **Opened 2026-08-12** from an audit of what A-06 actually shipped, run against the real bank and
> the real `drawQuestionIds` rather than against this document's account of them. Every number below
> is measured, not estimated. §9 named content as this project's main risk; the audit's finding is
> narrower and more urgent than "there isn't enough of it" — **the exam as shipped can be passed
> without knowing any testing**, and a passing attempt can be forged. A-07 issues certificates on a
> passing exam, so both are blocking for it.

**Split into three PRs**, along the same reasoning as A-04's split: rebalancing the bank touches six
content files and nothing else, single-use tickets are a schema change, and the runner's state
handling is client-side work. One review each.

#### A-10a — Answer-position bias and a content-shape guard `[x]`

> **Status: DONE** (2026-08-12, branch `feat/academy-a10a-shuffle-choices`) — but **narrower than
> this work order as written**, and the rest is split out as A-10d below. What shipped fixes the
> position bias and adds the guard. The bank is still 70 questions with no multi-answer items; that
> is content work, not code, and bundling it here would have held the fix behind weeks of writing.

**The finding.** The correct answer's position across all 70 questions:

| Option | a | b | c | d |
|---|---:|---:|---:|---:|
| Times correct | 35 | 31 | 4 | **0** |

Not one question in the bank is answered `d`, and only four are answered `c` — **the answer is `a`
or `b` in 66 of 70 questions (94%)**. Chapter 6 is the worst single case: 10 of its 12 answers are
`a`. Compounding it, the correct answer is the **longest** option in 76% of questions — the other
classic test-wise tell.

> **Corrected 2026-08-12, while building A-10a.** This paragraph first read "a candidate who always
> guesses `a` or `b` scores 66/70 = 94%, so the exam can be passed by someone who has read nothing".
> That conflated *coverage* with *score* and overstated the finding. Measured: always picking `a`
> scores **50%**, always `b` **44%**, and a candidate coin-flipping between the two lands at
> **~47%** — none of which clears the 65% line on their own. The real defect is narrower and still
> worth fixing: two of the four options are dead on almost every question, so noticing that lifts a
> blind guess from 25% to ~47%, and it is reading *the bank* that gets you there rather than the
> syllabus. With the longest-answer tell on top, a test-wise candidate carries a large unearned
> advantage into a paper whose whole purpose is to estimate readiness for the real one.

This is not a content-volume problem; the bank could grow to 300 questions and still be beatable
this way.

**Also in scope, because it is the same edit pass over the same six files:**

- **Chapter 5 is short.** 10 questions against a blueprint weight of 9, i.e. 90% of the pool is
  drawn into every paper. Chapter 4 is nearly as bad at 11 of 12. Measured over 200 seeds with the
  real draw function, two papers share **28.2 of 40 questions on average (70%), never fewer than
  23** — "different seeds → different papers" (§5.1) is true of the ordering and barely true of the
  content. Bringing every chapter to ≥5× its blueprint weight is the plan's own ≥300 target; the
  first useful step is levelling chapters 4 and 5, where the shortfall actually bites.
- **There are no multi-answer questions at all.** Zero of 70 set `multi`. The engine, the ticket,
  `sanitizeExamQuestion`, `ExamRunner`'s checkbox branch and `gradeAttempt`'s set-equality rule all
  support them, and §8's own A-02 entry describes the self-checks as "single- and multi-answer" — so
  a whole graded code path ships exercised only by the selftest's synthetic fixtures, and the paper
  is easier than the real one it simulates.
- **K-level spread is flat.** K1 28, K2 36, **K3 6**. K3 ("apply the technique") is what chapter 4
  is mostly about and what actually transfers to the sandbox exercises.
- **`syllabusRef` concentration.** 40 distinct refs across 70 questions, with `FL-6.1.1` alone
  carrying 6 of chapter 6's 12. §7.2 exists so a reviewer can check a question against its
  objective; six questions per objective means the chapter tests a narrow slice of it.

**The guard, which is the part that keeps this from regressing.** `scripts/academy-exam-selftest.mjs`
builds a synthetic 12-per-chapter bank, so it is structurally blind to everything above — it is why
the chapter-5 shortfall survived a work order and a doc review. Add a second selftest that runs
against the **real** bank and fails the build on: any chapter pool below 5× its blueprint weight; an
answer-position distribution more skewed than a stated tolerance; a question whose `multi` flag and
correct-answer count disagree; a missing `syllabusRef`, `kLevel` or explanation; and a duplicate id
or near-duplicate stem. Same `prebuild` wiring as its siblings, so `npm run build` covers it with no
CI change. Note that this cannot live in `exam-core.mjs`'s selftest as written — that file is pure
ESM by design and the bank is TypeScript; the guard needs the same content-reading approach
`scripts/academy-bundle-check.mjs` already uses.

**Acceptance:** the always-guess-`a`-or-`b` strategy scores at or below chance on the full paper;
every chapter pool is ≥5× its blueprint weight; mean overlap between two papers drawn from different
seeds is below 40%; the bank contains multi-answer questions in proportion to the real paper; the
new selftest fails the build when any of those regress, **proved by breaking each one deliberately**
(the standard `academy-bundle-check.mjs` set for itself in A-02).

**Delivered — and the plan was wrong about the fix.** This work order said to rebalance the answer
key by hand across the six content files. Building it made clear that is the weaker of two options:
it fixes only the 70 questions that exist today, silently re-breaks the moment someone writes the
71st with the answer first, and — because `getExamAttempt` recomputes `correctChoiceIds` from the
current bank — editing which letter is correct would retroactively corrupt the review view of every
attempt already taken.

Shipped instead: **`presentPaper(questions, seed)` in `exam-core.mjs` shuffles each question's
choices per attempt**, so position carries no information for any question there will ever be.
Seeded rather than random, so an attempt stays reproducible from its ticket — the same property the
draw already had. It is safe precisely because of two things A-06 got right: grading is set equality
over choice **ids**, and `ExamRunner` renders `c.text` with no position label, so a learner never
sees a letter at all. No content file changed, and no historical attempt is affected.

**Two guards, because neither is sufficient alone.** `scripts/academy-bank-check.mjs` (new, wired
into `prebuild`) reads the **real** bank — closing A-06's blind spot, where the selftest's synthetic
12-per-chapter fixture is why chapter 5's shortfall went unnoticed — and checks per-question shape
(id uniqueness, `multi` agreeing with the key, `syllabusRef`/`kLevel`/explanation present) plus the
statistical property, by simulating always-pick-the-first-option over 300 seeded papers through the
real `presentPaper`: **26.0%, passing 0 of 300**, against ~47% with the authored order. It also
*reports* the outstanding content debt on every build rather than asserting it, so A-10d stays
visible without failing the build today.

That script cannot see whether `beginAttempt` still calls `presentPaper` — delete the call and it
keeps passing, since it invokes the core function itself. **TC-E2E-114** is the guard for the
wiring: it walks two whole chapter-6 attempts and requires at least one question they share to have
been laid out differently. Both guards were **proved to fail**: removing the shuffle from
`presentPaper` fails the script (46.6%), and removing the call from `beginAttempt` fails
TC-E2E-114 with "all 6 shared questions were laid out identically in both attempts".

> **The first version of TC-E2E-114 was itself flaky, and it took arithmetic rather than a test run
> to notice.** It keyed on the *first* question of each of six attempts and looked for one drawn
> first twice. Chapter 6 has 12 questions, so the chance no question is ever first twice is
> `(12/12)(11/12)…(7/12)` ≈ **22%** — a guard that cries wolf one run in four, which is worse than
> no guard, and it passed three times (twice locally, once in CI) purely on luck. Comparing two
> *whole* attempts instead makes the overlap a pigeonhole certainty: 8 drawn from 12, twice, share
> at least `8+8-12 = 4` questions. All four-plus agreeing by chance is `(1/24)^4`, about three in a
> million. Worth stating because this suite already has flakes of exactly this kind (see A-10's
> "Not in A-10" note), and adding another while auditing them would have been ironic.

#### A-10b — Single-use exam tickets `[x]`

> **Status: DONE** (2026-08-12, branch `feat/academy-a10b-single-use-tickets`).

**The finding.** `submitExamAction` verifies the start ticket's signature and then grades it —
but never marks it used. There is no `jti`, no consumed-ticket store, and no unique constraint on
`ExamAttempt`. The ticket stays valid for `TICKET_MAX_AGE_SEC` (6 hours). So:

1. Start an attempt; submit it with no answers.
2. The graded response returns `correctChoiceIds` **and** `explanation` for every question — by
   design, it is the review screen.
3. Re-submit the *same ticket* with those answers. A second `ExamAttempt` row is written, 40/40,
   `passed: true`.

Today the damage is confined to a wrong row in `/academy/me`'s history. **A-07 issues a certificate
on a passing exam**, at which point this mints them on demand — so this lands before A-07, not
after it.

**Shape of the fix.** The authed half is cheap: `seed` is 16 random bytes minted per ticket, so
`@@unique([userId, seed])` on `ExamAttempt` makes a replay a constraint violation rather than a
second row, with no new table and no new state to expire. Return the existing attempt's id on the
conflict rather than an error — a genuine double-submit (a flaky connection, an auto-submit racing a
manual one, see A-10c) should land on its result page, not on a failure. The anonymous half is
deliberately left alone: §2.4 says anonymous attempts write no row, there is no certificate and no
history to corrupt, and a stranger fooling themselves costs nothing — closing it would mean
introducing exactly the server-side state §2.4 exists to avoid.

**While here, one inconsistency in the same file.** The chapter quizzes set `durationSec` to 24
hours with the comment "generous enough that no honest attempt ever hits it", but the real bound is
the ticket's own 6-hour `exp`, so a quiz left open longer fails verification with "expired or
invalid" and loses the answers. Either make the ticket's lifetime follow the blueprint's duration or
stop claiming 24 hours.

**Acceptance:** replaying a ticket cannot produce a second attempt row, asserted against
`ExamAttempt.count()` rather than the UI; a legitimate double-submit resolves to the original
attempt's result page; an anonymous submission still writes no row.

**Delivered.** `@@unique([userId, seed])` on `ExamAttempt` (no migration file — the repo uses
`prisma db push`, per A-04a), and a conflict path in `submitExamAction` that resolves to the
attempt that already exists instead of erroring. The chapter-quiz `durationSec` inconsistency
above is *not* fixed here and stays open — it is a content/config decision (which of the two
bounds is the real one), not part of closing the replay hole.

**One thing the plan didn't anticipate, and it changed the code.** The obvious conflict handler
returns the existing attempt's id alongside *this* request's graded verdicts — which would describe
an attempt that does not exist, mixing the replay's answers with the original's identity. The
handler re-grades from the row's stored `answersJson` instead, so what comes back is the attempt
that actually counts. The row is the record.

**Verified.** `e2e/academy.spec.ts` **TC-E2E-113** replays the *real* server-action request —
captured off the wire via `page.on("request")` and re-sent with `page.request.post`, same session
cookies — rather than calling the action from test code, because the hole was reachable by anyone
who could repeat an HTTP request they had just made. It asserts one row before and after, the same
attempt id, and that the replay resolves rather than 500s. **The guard was proved to fail**: with
the unique index dropped, the replay writes a second row carrying the identical `seed` — which is
the vulnerability, reproduced. All 23 specs in `e2e/academy.spec.ts` pass together; `tsc --noEmit`
and `next lint` clean.

#### A-10c — Resumable attempts and submit robustness `[x]`

> **Status: DONE** (2026-08-12, branch `feat/academy-a10c-resumable-attempts`). Closes the code
> half of A-10; what remains under it is A-10d, which is writing.

**The finding.** `ExamRunner` holds the ticket, the answers, the flags and the current index in
React state and nothing else. A reload, a back-navigation, a phone locking, or a tab crash **40
minutes into a 60-minute exam discards every answer and the ticket with them** — there is no way
back into that attempt. A-04b went to real trouble to keep the coach's `since` in `sessionStorage`
precisely so a redirect couldn't lose it; the exam, which is far longer and the higher-stakes of the
two, has none of that.

Mirror the attempt into `sessionStorage` (ticket, answers, flags, index) and offer to resume it on
mount when the ticket is still within its own deadline. The server stays authoritative for both the
clock and the grade — this stores nothing the ticket doesn't already sign, so it changes no trust
boundary. Note the one thing that must *not* be stored: the sanitized question set is fine, but this
is client-visible storage, so nothing may be written to it that `sanitizeExamQuestion` would strip.

**Second, the auto-submit can lock a candidate out.** Once the deadline passes, the one-second
`tick` calls `doSubmit()` on every tick. If submission fails — a transient network error is exactly
when this matters — `pending` clears and the next tick retries, one per second, into an endpoint
rate-limited at 20/minute. Twenty seconds of a bad connection at the deadline and the candidate is
locked out of submitting at all, for the rest of the minute, repeatedly. Auto-submit should fire
once, then back off and surface a manual retry.

**Acceptance:** an attempt survives a full page reload with answers and remaining time intact; a
failed auto-submit retries at most a few times with backoff and leaves the candidate able to submit
manually; the server-authoritative timer and grading behaviour of §2.3 are unchanged.

**Delivered.** `src/lib/academy/exam-session.ts` — the browser-side mirror (ticket, sanitized
questions, answers, flags, current index, and the ticket's own `startedAt`/`durationSec`), keyed
`tf_academy_exam:<templateSlug>` in `sessionStorage` so a chapter quiz opened in the same tab can't
clobber the full paper. `ExamRunner` writes it on every change, offers it back on mount as a
**resume banner on the start screen**, and clears it the moment an attempt is graded. Resuming is
offered, never automatic: someone who deliberately navigated back to start a fresh paper should not
be dropped into the old one, so the banner carries **Start over** next to **Resume attempt** and
says how many answers each choice keeps or discards.

**No trust boundary moved, and that is worth being explicit about.** Everything stored either came
from the client already (answers, flags, which question is on screen) or is in its hands anyway (the
signed ticket, the sanitized questions). `startedAt`/`durationSec` drive the countdown *display*
exactly as they did in React state; `submitExamAction` still re-derives both from the ticket's signed
payload, so §2.3's server-authoritative clock is untouched. The one rule that had to hold is that
nothing the server strips can re-enter through client-visible storage, so `readSnapshot` **rebuilds
each question field by field** rather than trusting the parse — a snapshot hand-edited to carry
`correct: true` still hydrates to a plain `PublicQuestion`. TC-E2E-115 asserts the stored JSON
carries no `"correct"`, `"explanation"` or `"chapter"` key.

**Two things the plan didn't call out, both decided while building.**

1. **A timed attempt whose deadline passed while the tab was gone needs no special case.** Resume
   drops into the taking phase, the countdown effect runs on mount, sees zero left, and auto-submits
   what was recovered — graded late, exactly as answered, which is already what §2.3 says the server
   does. The alternative (refusing to resume an expired attempt) throws away answers nobody ever got
   to submit, which is the same defect this work order exists to fix.
2. **The `pending` guard had to move into a ref.** `doSubmit` was a `useMemo` over `[…, pending, …]`,
   so its identity changed on every keystroke *and* every submit, tearing down and rebuilding the
   one-second interval each time; and a `pending` value read from a render-old closure is exactly how
   an auto-submit fires while the previous request is still in flight. `pendingRef` + `answersRef`
   make `doSubmit` depend only on `[ticket, router, templateSlug]`.

**Auto-submit now fires once and backs off** — `AUTO_SUBMIT_BACKOFF_MS = [2s, 6s, 18s]`, then it
gives up and renders a message plus a **Submit now** button. Four requests over ~26 seconds instead
of one a second, which leaves room in the 20/minute limit for the manual retry that follows. Only
the *auto* path backs off; a manual press is a person who has just been told to try again, and
gating that behind a timer would be the same lockout in a different costume.

**Verified.** `e2e/academy.spec.ts` **TC-E2E-115** (answer 1 and 3, flag 2, reload; the banner reads
"3 of 40 questions answered", resuming restores the same paper, the same question on screen, the
same checked choice, the same flag, and a clock that has *kept running* rather than reset to 60
minutes; "Start over" really does drop it) and **TC-E2E-116** (with the connection cut at the
deadline: bounded retries, the give-up UI, then the manual submit grading the paper and clearing the
mirror). Both **proved to fail**: disabling the per-change mirror leaves the banner at "0 of 40", and
restoring A-06's per-tick retry fails TC-E2E-116 with *"auto-submit's 4 requests spanned only 3.0s —
it is retrying on the tick, not backing off"*.

> **The first version of TC-E2E-116 didn't discriminate, and only the deliberate break showed it.**
> It asserted the request *count* (≤ 5), which the backoff array bounds whether or not the delays are
> honoured — the broken build sent the same four requests, just inside three seconds, and the test
> passed. What separates backing off from hammering is *when* the retries land, so the assertion is
> now the span between the first and last request. Same lesson as A-10a's flaky first draft of
> TC-E2E-114: a guard is not a guard until it has been watched to fail.

**Clock injection, and why not `page.clock`.** TC-E2E-116 skews only the page's `Date.now` by an
init script, leaving `setInterval` on the real clock. Playwright's `page.clock` would have frozen the
one-second tick this test is entirely about — timers only advance under manual control, and the
submit requests it triggers need real time to settle. The server's clock is untouched either way,
which is the point: it is the only one that decides "late".

**Not fixed here, and still open:** A-10b's note that the chapter quizzes claim a 24-hour
`durationSec` while the ticket's own `exp` bounds them at 6 hours. It stays a content/config
decision about which bound is real, not part of making an attempt survive its tab. `readSnapshot`
mirrors the 6-hour figure and says so — a stale copy only decides whether a resume is *offered*,
and the server rejects an expired ticket regardless.

#### A-10d — Question-bank build-out `[x]`

Split out of A-10a once shuffling made the answer-position half a code fix. What was left is the
content, and it is the "weeks of writing" §9 warns about — `scripts/academy-bank-check.mjs` prints
the current state on every build.

**Shipped 2026-08-13, over eight slices: 70 → 255 questions.** Every property this work order set out
to establish is now a build assertion rather than a printed number: chapter pools at 7× the draw for
chapters 4 and 5 and 5× elsewhere, all 64 learning objectives covered, at least 3 questions per
objective, multi-answer key counts that vary, no answer quoted in its own stem, and both guessing
strategies — first choice and longest choice — held near the 25% chance line and passing 0 of 300
simulated papers. The ≥300-question target did not survive contact with the blueprint and was
replaced rather than met; see the seventh and eighth slices below.

**First slice, 2026-08-12: chapter 4 only.** Chapter 4 was the sharper of the two priority chapters
(11 of 40 paper questions against chapter 5's 9, and the one the K-level note below singles out), so
it went first rather than splitting effort across both. 24 new questions (`ch4-q13`…`ch4-q36`),
taking chapter 4 from 12 to 36 of its 55-question target, widening its `syllabusRef` coverage from 7
refs (FL-4.2.x–4.4.1 only) to 14 (adds FL-4.1.1 and all of FL-4.5, the collaboration-based
techniques, previously untouched), adding the bank's first 6 multi-answer questions, and skewing new
content K3 — chapter 4 alone now carries 10 of the bank's 16 K3 questions. Verified against
`academy-bank-check.mjs`, `academy-exam-selftest.mjs`, `academy-checks-selftest.mjs` and `tsc
--noEmit`; no e2e change needed since nothing in `e2e/academy.spec.ts` or the engine hardcodes a
chapter's question count. Chapters 1, 2, 3 and 5 are unchanged and still the bulk of the remaining
work — chapter 5 in particular, which shares chapter 4's priority but wasn't touched this pass.

> **Corrected 2026-08-12, auditing the slice above before starting chapter 5.** The 6 multi-answer
> questions shipped with the same defect A-10a exists to prevent, one dimension over. Every one of
> them was 5 choices with exactly 3 correct, so shuffling — which randomises *position* — left the
> *cardinality* learnable: a candidate who drills the bank and notices ticks 3 and guesses at 1-in-10
> instead of the 1-in-26 a subset guess costs when the count is unknown. A 2.6× lift bought by
> reading the bank rather than the syllabus, which is exactly the trade A-10a closed for answer
> position. Choice count was a second tell: 5 choices meant multi and 4 meant single, without
> exception. Both are now broken — key counts span 2/3/4 across five distinct (choices, keys) shapes,
> and 4- and 5-choice questions appear on both sides of the `multi` flag.
>
> Worse than the content bug: **`academy-bank-check.mjs` could not have caught it.** Its guessing
> simulation scored a paper with `q.choices[0].correct`, which is single-answer logic — under
> set-equality grading a one-choice pick against a 3-key question is wrong unconditionally, so every
> multi question was counted wrong without ever being modelled. The guard went blind to precisely the
> content being added to it. The simulation now grades with set equality against a candidate who has
> learned the bank's modal key count, and a structural assertion fails the build outright if the multi
> questions ever share one key count again (threshold 3, so a chapter can land its first couple
> without tripping it). The assertion was verified by reintroducing the uniform shape and watching the
> build fail, then reverting — a guard nobody has seen fail is not a guard.
>
> One more, unrelated: `ch4-q21` was tautological. It asked which sequence gives 1-switch coverage of
> the pair `PENDING → PAID → SHIPPED` and offered `PENDING → PAID → SHIPPED` as the answer, so string
> matching beat knowing the technique, and its correct-answer text was identical to `ch4-q9`'s — two
> near-twins that could land in the same paper. Replaced with a counting question over an explicit
> five-transition model (answer: 3 pairs, since DELIVERED and CANCELLED are terminal).
>
> The general lesson for the chapters still to be written: **shuffling only launders the dimensions it
> touches.** Anything else an author does uniformly across a batch — subset size, choice count, stem
> phrasing, which distractor is the joke one — stays learnable, and `presentPaper` will not save it.

**Second slice, 2026-08-12: chapter 5 complete.** 35 new questions (`ch5-q11`…`ch5-q45`) take chapter
5 from 10 to its full 45-question target — the first chapter to clear 5× its blueprint weight since
chapter 6, and the one that most needed it: 9 of the paper's 40 questions were being drawn from a
pool of 10, so two papers shared nearly all their chapter 5 content. New ground covered: iteration
and release planning, definition of ready, three-point and metrics-based estimation, planning poker,
test case prioritization, the test pyramid, the testing quadrants, product versus project risk, risk
control, defect density and DDP, progress versus completion reports, audience-appropriate status
communication, and configuration management. Refs go from 6 distinct to 19; K-levels land K1 4 / K2
29 / K3 12. Shapes follow the correction above from the start — 6 multi questions spanning 2/3/4
correct answers across 4-, 5- and 6-choice questions, with single-answer questions at 4 and 5
choices too.

> **`syllabusRef` in chapter 5 — read this before the §5.1 verification pass.** This chapter's refs
> are *topic-sequential in authoring order*, not structural: `FL-5.1.2` is risk-based testing,
> `FL-5.2.1` is entry/exit criteria, `FL-5.3.1` is defect reporting, `FL-5.4.1` estimation, `FL-5.5.1`
> metrics. Chapter 4's refs, by contrast, do track the syllabus's own section structure. The new
> questions **extend chapter 5's existing scheme rather than realigning it**, deliberately: §8 "Not in
> A-10, deliberately" rules that syllabus verification gets its own pass and that folding it into a
> code PR would bury it. So the divergence is preserved, not compounded — and the table below makes
> the eventual realignment a mechanical find-and-replace per ref rather than a re-read of 45
> questions.
>
> | Ref | Topic | Qs | Ref | Topic | Qs |
> |---|---|---|---|---|---|
> | `FL-5.1.1` | Test plan purpose & content | 3 | `FL-5.2.2` | Definition of ready | 1 |
> | `FL-5.1.2` | Risk-based testing, risk level | 3 | `FL-5.3.1` | Defect reports | 5 |
> | `FL-5.1.3` | Iteration & release planning | 2 | `FL-5.3.2` | Defect management process | 1 |
> | `FL-5.1.4` | Product vs project risk | 2 | `FL-5.4.1` | Estimation, general | 3 |
> | `FL-5.1.5` | Risk analysis & control | 2 | `FL-5.4.2` | Three-point estimation | 1 |
> | `FL-5.1.6` | Test pyramid | 2 | `FL-5.4.3` | Planning poker | 1 |
> | `FL-5.1.7` | Testing quadrants | 2 | `FL-5.5.1` | Test metrics | 5 |
> | `FL-5.1.8` | Test case prioritization | 3 | `FL-5.5.2` | Test reports | 2 |
> | `FL-5.2.1` | Entry & exit criteria | 4 | `FL-5.5.3` | Communicating status | 1 |
> | | | | `FL-5.6.1` | Configuration management | 2 |

> **Corrected 2026-08-12, auditing chapter 5 on the way in.** Running the same audit over the whole
> bank before opening the PR caught a tautology that predates A-10d entirely: `ch4-q9`, authored in
> A-06, described its state model as "PENDING → PAID → SHIPPED" and offered that exact string as the
> correct choice, so a candidate could match text without knowing what 0-switch coverage is. It is the
> same defect the correction above removed from `ch4-q21` — and `ch4-q21` was flagged *as q9's twin*
> at the time, yet q9 itself was left standing. Now reframed as a coverage-percentage question (2 of 3
> transitions = 67%).
>
> Having survived the original authoring, the A-10a audit, the A-10d review and a PR that explicitly
> named it, this one graduated from "fix it" to "make the build do it": `academy-bank-check.mjs` now
> asserts that no correct choice appears verbatim inside its own stem, normalised to letters and
> digits so punctuation and arrow glyphs can't hide the overlap, with a 16-character floor so short
> factual answers ("67%", "16 days") don't trip on a number that legitimately appears in the question.
> Verified by re-injecting the defect and watching the build fail. Shuffling is no defence here —
> `presentPaper` randomises position, never text.

**Third slice, 2026-08-12: chapter 4 complete.** 19 new questions (`ch4-q37`…`ch4-q55`) close
chapter 4 at its full 55-question target, leaving chapters 1, 2 and 3 as the entire remaining pool
debt. New ground: `FL-4.1.1` grows from 1 question to 3 (which category of technique the available
documentation actually permits, and what legitimately drives technique selection), and **`FL-4.3.3`
— the value of white-box testing — gets its first 3 questions**, having been the one chapter 4
objective with no coverage at all. The rest deepens the techniques the blueprint leans on: output
partitioning and why invalid partitions are covered one field at a time, three-value BVA, decision
table coverage as a percentage of rules, 0-switch coverage arithmetic, state tables versus diagrams,
use case flow coverage, why 100% statement coverage cannot see a requirement nobody implemented, and
the branch-implies-statement direction. Refs go 14 → 15 distinct, all 15 of chapter 4's objectives
now covered; K-levels land K2 32 / K3 23.

> **The longest answer was worth a pass, and nobody had checked.** `questions/index.ts` has carried a
> line since A-10a noting that the correct answer is the longest option in 76% of the bank, filed as
> one of the things shuffling cannot fix. This slice finally measured what that is worth: **a
> candidate who always picks the longest choice was right on 70.9% of the bank's single-answer
> questions and scored 65.2% over whole simulated papers — a pass, against a 65% line.** That is a
> *better* exploit than the answer-position bias A-10a was written to remove, which topped out at
> ~47% and never passed a paper — and unlike position, it had been sitting in the bank with a comment
> pointing straight at it for two slices.
>
> There is no code fix. `presentPaper` randomises where the choices appear, not how many words they
> contain, so the only remedy is writing distractors with the same care as keys, chapter by chapter.
> What ships here is therefore a **ratchet, not a cure**: `academy-bank-check.mjs` now runs the
> strategy end to end against the real blueprint draw (longest choice for single-answer, the modal
> key count's worth of longest choices for multi) and fails the build if the score rises above a
> recorded ceiling. The ceiling only ever moves down, and the assertion becomes a flat "never passes"
> once the paper pass rate reaches zero. Verified the way A-10a's assertions were: run against the
> pre-slice chapter 4 with the new ceiling in place, the build fails at 65.2%.
>
> Chapter 4's 19 new questions are the first batch written against the tell — 4 of their 16
> single-answer questions have the longest choice correct, which is chance at four choices — and that
> alone took the whole-paper score from 65.2% to **63.3%**, now under the pass line. It still passes
> **149 of 300 papers**, because a mean under 65% with this much variance still clears the bar half
> the time. So this is not closed; see the debt list below.

**Fourth slice, 2026-08-12: the length pass, all six chapters.** The debt list below used to open
with the longest-answer tell and a plan to work through it chapter by chapter. It was done in one
pass instead: **204 choice texts rewritten across 56 questions in all six files**, no question added or
removed, no key changed. Two rules applied throughout — *keep the key to the claim and let
`explanation` carry the reasoning*, and *give every distractor enough substance to be worth reading*.
The before/after, measured by `academy-bank-check.mjs` over 300 simulated papers:

| | before | after |
|---|---|---|
| longest-choice strategy, whole paper | 63.3% | **31.4%** |
| papers it passes | 149/300 | **0/300** |
| ch1 / ch2 / ch3 / ch4 / ch5 / ch6 | 58 / 58 / 83 / 46 / 82 / 83% | 25 / 25 / 25 / 30 / 31 / 25% |

25% is the floor for a four-choice question, so every chapter is now at chance. The guard changes
shape to match: `LONGEST_CEILING_PCT` drops 64 → 40 and gains a hard "never passes a paper"
assertion, the same pair the first-choice strategy has had since A-10a. Both were verified by
running them against the pre-slice content, where they fail at 63.3% and 149/300.

> **A second tell surfaced while doing it, and is worth writing down: the joke distractor.**
> `ch5-q9` asked which metric tracks execution progress and offered "the office's total electricity
> usage" and "the number of team lunches held" as two of its four options. A candidate discards both
> without reading the stem, so the question is really a two-way choice — the same halving of the
> guess space the answer-position bias bought, arrived at from the other direction. Those are now
> plausible-but-wrong metrics, and the rule is in `questions/index.ts` next to the length one.
> Nothing in the bank-check can detect this; it needs an author who is honest about which of their
> distractors nobody would ever pick.

**Fifth slice, 2026-08-13: chapter 1 complete, and the first chapter written after A-10e.** 28 new
questions (`ch1-q13`…`ch1-q40`) take chapter 1 from 12 to its full 40-question target — the sharpest
remaining pool, drawing 8 of the paper's 40 from 12. What makes this slice different from the four
before it is that the writing order came from the build rather than from a topic list: **eight of
chapter 1's fourteen objectives had no question at all**, and between them they carry 21 of the 28.
New ground: testing versus debugging and the reproduce/diagnose/fix sequence (`FL-1.1.2`), testing
versus quality assurance (`FL-1.2.2`), the test process in context (`FL-1.4.2`), testware and which
activity produces which work product (`FL-1.4.3`), traceability (`FL-1.4.4`), the test management and
testing roles (`FL-1.4.5`), the generic skills and why communication is singled out (`FL-1.5.1`), and
the whole team approach (`FL-1.5.2`). All 14 objectives now covered; chapter 1 leaves the pool debt
line entirely.

> **The list the build prints is a better brief than a chapter count.** Before A-10e this slice would
> have been "write 28 more chapter 1 questions", and the obvious way to do that is to deepen what is
> already there — chapter 1 had five questions on the seven principles and none on testware. Writing
> against the untested-objective list instead produced a chapter that covers the syllabus rather than
> the previous author's interests. Worth saying because chapters 2 and 3 are next and the same trap
> is set: chapter 2 currently has seven of its twelve questions on test levels and types, and is
> missing five of the six `FL-2.1.x` objectives — DevOps, shift left, test-first approaches,
> retrospectives, good practices across lifecycles.

**Sixth slice, 2026-08-13: chapters 2 and 3, and the pool debt closes.** 18 new questions in chapter
2 (12→30) and 8 in chapter 3 (12→20) take the bank to **202** and put **every chapter at or above 5×
what the blueprint draws from it**. All 64 learning objectives now have at least one question.

Chapter 2 was the most lopsided chapter in the bank, and the objective list is what made that
visible: seven of its twelve questions sat on test levels and types, while **five of the six
`FL-2.1.x` objectives had none at all**. A chapter titled *Testing Throughout the Software
Development Lifecycle* had almost nothing in it about lifecycles — no DevOps, no shift left, no
test-first approaches, no retrospectives, and nothing on the good practices that hold whichever model
is in use. 14 of its 18 new questions land there. Chapter 3's eight open the two remaining
objectives: the benefits of early and frequent stakeholder feedback, and the activities of the review
process itself — planning, initiation, individual review, communication and analysis, fixing and
reporting — which is the one a candidate is most likely to be asked to put in order.

> **The two reported debt lines become assertions.** The paragraph below this list has said since
> A-10a that the bank-check's *reported* debt should become *asserted* once the pools grow, and that
> the script was written so each is a one-line change. That moment is now: every chapter is at 5×,
> every objective is covered, so `academy-bank-check.mjs` fails the build if a chapter's pool drops
> below 5× its draw or if any of the 64 objectives loses its last question. Both verified by deleting
> chapter 3's new questions and watching both fire, then reverting. What they protect is the reverse
> of what they measured for five slices: not "write more", but "do not quietly delete the coverage
> six slices paid for".

> **On the mirror of the length tell.** Chapter 3's singles have the key as the *shortest* choice 39%
> of the time, against a 25% chance line, which looked like the length tell arriving from the other
> direction. It is not. Re-measured with a margin a candidate could actually see — key shorter than
> every distractor by ≥10 characters — chapter 3 scores **0%**, and the whole bank scores 4 questions
> out of 178 singles. The 39% is made of 1- and 2-character margins, which nobody can eyeball. Worth
> recording because the raw percentage is the kind of number that gets acted on: the fix would have
> been to pad six keys for no reader-visible benefit, and the guard that matters is the paper-level
> simulation, which prices what a strategy is actually worth rather than how often a rule happens to
> fire.

**Seventh slice, 2026-08-13: 7× where the paper draws hardest.** 22 new questions in chapter 4
(55→77) and 18 in chapter 5 (45→63) take the bank to **242**. This is the answer to the ≥300 line
below, and it is a change of rule rather than a push to a number — see the eighth slice for why.
Chapters 4 and 5 draw 11 and 9 of the paper's 40 between them, half the paper out of two pools, and
at 5× two sittings still overlapped by about a fifth in each. The writing order came from
per-objective depth: chapter 5's `FL-5.2.4` (responding to analyzed product risks) and `FL-5.3.3`
(communicating status) held **one question each**, so a paper could only ask about them one way, and
chapter 4's `FL-4.4.1` and `FL-4.5.2` held two. Chapter 4's extra weight went to the four K3
black-box objectives, now 9 questions apiece. Written against the length tell rather than measured
after it: ch4 28%→23%, ch5 31%→24%, whole bank 27.0%→23.8%.

> **A process failure worth recording, because it cost two extra commits on `main`.** The PR for this
> slice was opened from a branch cut from `feat/academy-a07-certificates` rather than from `main` —
> another session had switched the working tree to that branch between this session's opening
> snapshot and the `git checkout -b`, and the snapshot was trusted instead of the repo. Squashing it
> merged the whole A-07 certificate feature, 17 files the PR did not mention, under a title about the
> question bank, while A-07's own PR was still open and unreviewed. Reverted in full (`git diff
> f112661 HEAD` empty, so `main` returned exactly where it was), then re-opened from `main` carrying
> the two question files alone. The lesson is one line: **check the current branch immediately before
> branching, not at the start of the session.** A repo with more than one agent working in it has no
> stable "current branch".

**Eighth slice, 2026-08-13: the depth floor, and A-10d closes.** 13 new questions — ch1 40→44, ch2
30→33, ch3 20→26 — take the bank to **255** and put every one of the 64 learning objectives at
**three questions or more**. Chapter 3 carried six of the thirteen thin objectives, more than any
other chapter, because its pool is the smallest in the bank while its objective count is not.

**What replaced the ≥300 target.** §9 asked for ≥300 questions *and* ≥5× the draw per chapter. The
second is derived from the blueprint; the first was a round number written before the blueprint
weights were known, and the two disagree — 5× yields 200. Reaching 300 uniformly would have meant
padding chapter 6, which has two learning objectives and cannot spread past them without asking the
same thing six ways. So the multiplier follows the draw instead: **7× for chapters 4 and 5, 5×
elsewhere**, plus a **floor of 3 questions per objective**. §9 now states that rule and no longer
states 300.

Both are assertions in `academy-bank-check.mjs` as of this slice, and both were verified the way
every guard in this work order has been — re-inject the defect, watch the build fail, revert.
Deleting chapter 4's last eight questions fails the pool assertion at `ch4 69/77` *and* the depth
floor at `FL-4.4.1 2, FL-4.5.2 2`; deleting a single chapter 3 question fails the floor alone at
`FL-3.2.3 2`.

> **Why the depth floor is the measure the coverage assertion could not see.** "At least one question
> per objective" was the right bar while 17 objectives had none, and the sixth slice was right to
> assert it. But it is satisfied by an objective a candidate meets exactly once, in a form they have
> already seen — the same defect as a thin chapter pool, one level down, and invisible to a
> chapter-level count. `FL-5.2.4` and `FL-5.3.3` sat at one question through six slices for precisely
> that reason: nothing was counting past zero. Three is deliberately modest. It is what makes two
> sittings differ on an objective, not what makes an objective well covered — the draw-heavy chapters
> run far above it. Raising this floor is the lever if the bank is ever to grow again, and it points
> effort at what is thin rather than at what is easy to write for, which is the fifth slice's lesson
> restated as a number.

Remaining debt, current as of 2026-08-13:

- ~~**Pools to ≥5× their blueprint weight.**~~ **Closed by the sixth slice**, and asserted at the
  seventh's revised multiple: ch1 44, ch2 33, ch3 26, ch4 77, ch5 63, ch6 12 — 7× the draw for
  chapters 4 and 5, 5× for the rest.
- ~~**The ≥300-question target is not met.**~~ **Closed by the seventh and eighth slices**, by
  replacing the target rather than by meeting it. 255 questions at 7×/5× the draw, with a floor of 3
  questions per objective; §9 carries the rule and no longer carries the 300.
- **Multi-answer questions.** 30 of 255 — 12 in chapter 4, 9 in chapter 5, 4 in chapter 1, 3 in
  chapter 2 and 2 in chapter 3, spanning 2/3/4 correct answers across **eight distinct (choices,
  keys) shapes** from 4ch/2k to 6ch/4k. Only chapter 6 still has none, and with 12 questions across 2
  objectives it is the one chapter where that is defensible. Each chapter varies its own shapes
  rather than settling on one, or the build fails (see the correction above).
- **`kLevel` against the objective's own level.** ~~Unverified~~ — **closed by A-10e 2026-08-13.**
  Both A-10d doubts were right (`FL-4.5.2` is K2 and `FL-4.5.3` is K3, so `ch4-q34`/`q35`/`q36` were
  inverted; `FL-4.3.2` is K2, so `ch4-q24`'s K3 was the wrong tag of the pair), and 71 more were
  wrong besides. The field is no longer authored: it is the objective's level, and the build fails if
  the two disagree.
- **K-level balance.** ~~K1 28 / K2 85 / K3 35~~ → **K1 19 / K2 86 / K3 43** after A-10e retagged
  against the syllabus, and **K1 45 / K2 153 / K3 57** at 255 questions. **This line was chasing a
  target that does not exist**, and is closed with the rest. Only 8 of the 64 objectives are K3 — `FL-4.2.1`–`FL-4.2.4`, `FL-4.5.3`, `FL-5.1.4`,
  `FL-5.1.5`, `FL-5.5.1` — and every one of them is in chapter 4 or 5. So "chapters 1, 2, 3 and 6
  carry none of the K3 growth" was never debt: those chapters *have* no K3 objectives, and a K3
  question in them would be a question the real paper could not ask. The achievable mix is a
  consequence of the blueprint, not something an author balances.
- ~~**`syllabusRef` spread.**~~ ~~61 distinct refs across 148 questions~~ → **all 64 objectives, at
  least one question each, across 202** — A-10e's 49, plus the eight chapter 1 closed in the fifth
  slice and the seven chapters 2 and 3 closed in the sixth. **Closed and asserted.** `FL-6.1.1`
  carries 8 of chapter 6's 12, which is as spread as chapter 6 can be: the syllabus gives it two
  objectives.
- ~~**Depth per objective.**~~ ~~Several objectives carry a single question, so a paper can only ask
  about them one way.~~ **Closed by the seventh and eighth slices and asserted** at a floor of 3;
  across the 64 the spread is now min 3, median 3, max 9. This was the line the ≥300 decision was
  told to point at, and it is what the decision produced.

The lines above that say "asserted" are the ones this paragraph used to promise: the bank-check's
*reported* debt became *asserted* the moment the pools allowed, which was A-10d's sixth slice for
chapter pools and objective coverage, and its eighth for per-objective depth. Until then a build that
failed on content the team was mid-way through writing would just have been muted, taking the
guessing assertions with it. **Nothing on this list is now reported-only**, which is what closes
A-10d: every property the work order set out to establish either holds and fails the build if it
stops holding, or is recorded above as a target that turned out not to exist.

#### A-10e — Syllabus alignment: real refs, real K-levels `[x]`

Opened 2026-08-12 from an audit of the whole bank against the **real CTFL v4.0.1 syllabus PDF**,
which the owner supplied after A-10d's fourth slice landed. Same shape as A-10 itself, which was
opened from an audit of A-06: the thing that made the audit possible was a document nobody had, and
every finding below was invisible to `academy-bank-check.mjs` by construction — the script can check
the bank against *itself*, never against the syllabus.

**Every question tag in the bank was authored from memory of the syllabus, not from the syllabus.**
That is the root cause, and it produced three distinct defects.

**1. 26 of 148 questions cite a `syllabusRef` that does not exist in v4.0.1** — 14 distinct invented
codes. 20 of them are a mechanical remap:

| Bank ref | Topic | Qs | Correct ref |
|---|---|---|---|
| `FL-2.2.4` | Acceptance testing goal | 1 | `FL-2.2.1` |
| `FL-2.3.2`, `FL-2.3.3` | Performance / white-box as test types | 2 | `FL-2.2.2` |
| `FL-2.3.4` | Confirmation & regression testing | 2 | `FL-2.2.3` |
| `FL-2.4.1` | Maintenance testing and triggers | 2 | `FL-2.3.1` |
| `FL-3.3.1` | Static analysis | 3 | `FL-3.1.1`/`FL-3.1.2` — needs a judgement call, see below |
| `FL-5.1.8` | Test case prioritization | 3 | `FL-5.1.5` |
| `FL-5.4.1`–`FL-5.4.3` | Estimation, three-point, planning poker | 5 | `FL-5.1.4` |
| `FL-5.5.2`, `FL-5.5.3` | Test reports, communicating status | 3 | `FL-5.3.2`, `FL-5.3.3` |
| `FL-5.6.1` | Configuration management | 2 | `FL-5.4.1` |

Chapter 5 needs a full renumber, not just these — the "topic-sequential, not structural" scheme
recorded in A-10d's second slice is confirmed wrong against the real §5, and the divergence it
deliberately preserved can now be closed. Real structure: **5.1** Test Planning (`.1`–`.7`), **5.2**
Risk Management (`.1`–`.4`), **5.3** Test Monitoring, Control and Completion (`.1`–`.3`), **5.4**
Configuration Management (`.1`), **5.5** Defect Management (`.1`). The tells: bank `FL-5.1.2` is risk
level (really `FL-5.2.1`), bank `FL-5.3.1` is defect reports (really `FL-5.5.1`), bank `FL-5.5.1` is
metrics (really `FL-5.3.1`) — metrics and defect reports are **swapped**, which is the kind of error
that survives review precisely because both codes exist and both look plausible.

**2. Six questions test material ISTQB removed from Foundation Level in v4.0.** Not mistagged —
unexaminable. The syllabus Release Notes say so outright: *use case testing* was removed (it lives in
Advanced Test Analyst now), as was the section on *tool selection, pilot projects and introducing
tools*. Affected: `ch4-q10`, `ch4-q22`, `ch4-q48` (use case flows), `ch6-q5`, `ch6-q6`, `ch6-q10`
(tool selection, pilot, rollout). **This is the worst class of defect in an exam bank** — not a bad
question, but a correct question about the wrong syllabus, which teaches a candidate something they
will be marked down for not un-learning. They are also the only findings here that cost content:
everything else is a tag change.

**3. 58 of the 122 questions on valid refs carry a `kLevel` that contradicts the objective's own
level** — 24 tagged higher, 34 lower. The A-10d doubts were both right: `FL-4.5.2` is K2 and
`FL-4.5.3` is K3, so `ch4-q34`/`q35`/`q36` are inverted exactly as suspected; `FL-4.3.2` is K2, so of
the `ch4-q24`/`ch4-q50` pair it is the K3 tag that is wrong. The systematic one nobody suspected:
**all four `FL-4.2.x` objectives (equivalence partitioning, BVA, decision tables, state transition)
are K3, and 10 of the bank's questions on them are tagged K2.** Chapter 4 is the heaviest chapter on
the blueprint, so the bank has been quietly modelling the paper as easier than it is. Per-file:
ch1 5, ch2 1, ch3 3, ch4 19, ch5 22, ch6 8. Chapter 5's 22 must be recounted *after* the remap in
finding 1 — some are artefacts of pointing at the wrong objective.

**4. 17 of the 64 real objectives have no question at all.** Not a defect — the writing order for
A-10d's remaining pools, which until now was "write 28 more for ch1" with no further guidance:

> `FL-1.2.2` `FL-1.2.3` `FL-1.4.3` `FL-1.4.4` `FL-1.4.5` `FL-1.5.2` `FL-1.5.3` · `FL-2.1.2`
> `FL-2.1.3` `FL-2.1.4` `FL-2.1.5` `FL-2.1.6` · `FL-3.1.3` `FL-3.2.5` · `FL-5.2.3` `FL-5.2.4`
> `FL-5.3.3`

Nearly all of `FL-2.1.x` is missing — test-first approaches, DevOps, shift left, retrospectives —
which is most of what makes chapter 2 a *modern* SDLC chapter rather than a waterfall one.

**Scope.** Land the syllabus in the repo as data, then fix the bank against it: `src/content/academy/
syllabus-los.ts` holding all 64 objective codes with their K-levels and titles (`server-only` is
unnecessary — objective codes are not answers); remap the 20; rewrite the 6 onto valid objectives
rather than deleting them, so the pools do not shrink and A-10d does not inherit the work; correct
the K-levels last, after the remap changes which objective each question points at.

**The guard, which is the durable half.** Two assertions in `academy-bank-check.mjs`: every
`syllabusRef` must exist in `syllabus-los.ts`, and every `kLevel` must equal its objective's
K-level. Both verified the way A-10a's and A-10d's were — re-inject the defect, watch the build
fail, revert. After this, the entire class of error is unrepresentable: a question citing an invented
objective, or claiming a cognitive level the syllabus does not assign it, cannot reach `main`. That
matters more than the 84 fixes, because A-10d still has ~54 questions to write and every one of them
would otherwise be authored the same way the first 148 were.

**Deliberately not in A-10e.** The `FL-3.3.1` static-analysis trio needs an author's judgement — v4.0
folds static analysis into `FL-3.1.1`/`FL-3.1.2` rather than giving it its own objective, and which
of the two fits depends on each question. Three questions is small enough to decide in review rather
than pre-commit here. And the blueprint weights and 65% pass line stay open — see §5.1; they are
blocked on a document, not on this work order.

---

**Shipped 2026-08-13.** The 64 objectives now live in `src/lib/academy/syllabus-los.mjs`, with
`src/content/academy/syllabus-los.ts` as the typed face the app imports. Plain ESM plus a typed
wrapper rather than the single `.ts` file the scope above called for, for the same reason
`exam-core.mjs` is shaped that way: `academy-bank-check.mjs` runs under bare `node` in `prebuild`,
and a table it has to type-strip to read is a table it can silently stop reading. What the file
carries is the identifier, the section, the K-level and a **topic label written here** — not the
syllabus's own sentence for each objective. The facts are what the guard checks; the prose is not
ours to ship, and §7.2's rule applies to this file as much as to a question.

The fix came out larger than the audit predicted, in one direction that matters:

| | audited | shipped |
|---|---|---|
| refs corrected | 26 invalid | **70** — 26 invalid, 44 valid but naming the wrong objective |
| `kLevel` corrected | 58 (24 high, 34 low) | **73** (27 high, 46 low), counted after the remap |
| questions rewritten | 6 | 6 |

**The 44 is the finding worth keeping.** The audit enumerated the invalid codes, and separately
noticed that chapter 5's *valid* codes pointed at the wrong topics. That second defect is not
confined to chapter 5 — `ch1-q2`/`ch1-q3` asked about error/defect/failure while citing "testing
versus debugging"; `ch1-q12` asked about independence while citing the generic-skills objective;
`ch3-q5`–`ch3-q8` had the roles and the review-types objectives swapped; `ch2-q1` cited "impact of
the lifecycle" for a question whose answer is shift left; `ch4-q12` cited error guessing for an
exploratory-testing question. Each one resolves to a real objective and would have passed the new
existence check, so a reviewer following the ref would have found something plausible and moved on.
Only reading all 148 against the table catches these, and the new assertions do not — they are why
the ref count went 26 → 70.

The `FL-3.3.1` trio went to `FL-3.1.2` (the value of static testing), all three: what static analysis
finds without executing, what a complexity score means, and what it buys in a pipeline are all
arguments for static testing's value rather than statements about which work products it can examine
(`FL-3.1.1`). `kLevel` was corrected last, from the objective each question ended up on.

**`kLevel` stopped being an authored field.** It is the objective's level, and the build fails if
they disagree — which is the only definition anything can check, and the one the real paper uses.
What no script can check is whether a question as *written* demands that much: `ch5-q26` diagnoses an
inverted test pyramid, which is more than the K1 recall `FL-5.1.6` asks for, and `ch4-q15` lists true
statements about equivalence partitioning, which is less than `FL-4.2.1`'s K3 "use it to derive test
cases". Both now carry their objective's level honestly and are over- or under-written against it.
That is content debt for §5.1's human pass, not something to launder by relabelling — the visible
cases are roughly a dozen, chapter 4 and chapter 5 heaviest.

**The rewritten six.** `ch4-q10` → checklist-based testing and how a checklist ages (`FL-4.4.3`),
`ch4-q22` → deriving acceptance tests from an ATDD conversation (`FL-4.5.3`), `ch4-q48` → what the
tester specifically contributes to collaborative story writing (`FL-4.5.1`); `ch6-q5` → defect
management tools (`FL-6.1.1`), `ch6-q6` → the risk that a green suite only covers what someone
thought to encode (`FL-6.2.1`), `ch6-q10` → what CI tooling does and does not change (`FL-6.1.1`).
Pools unchanged at 55 and 12. All six were written against A-10d's length rule, and the
longest-choice strategy moved 31.4% → 31.1%, still 0/300 papers.

**The guards.** Three assertions, not two: a ref must exist, its chapter must match the question's
own `chapter`, and `kLevel` must equal the objective's. The chapter check was not in the scope and
costs nothing — it catches a typo like `FL-4.2.1` on a chapter 5 question, which is exactly how
chapter 5's numbering went wrong in the first place. All three verified the way A-10a's and A-10d's
were: re-injected `FL-6.3.1`, pointed `ch5-q2` at `FL-4.2.1`, watched the build fail on each, then
reverted. The bank-check also now prints objective coverage per chapter and names the untested
objectives, which is reported rather than asserted for the same reason the pool sizes are — chapters
1, 2 and 3 are mid-build.

> **The uncovered list moved, and it is not the audit's list any more.** The work order recorded 17
> objectives with no question. After the remap it is **15**, and only nine names are common to both.
> Eight of the audit's 17 turned out to be covered all along by questions that were citing the wrong
> ref (`FL-1.2.3`, `FL-1.5.3`, `FL-2.1.5`, `FL-3.1.3`, `FL-3.2.5`, `FL-5.2.3`, `FL-5.2.4`,
> `FL-5.3.3`), and six new ones appeared for the mirror-image reason — `FL-1.1.2`, `FL-1.4.2`,
> `FL-1.5.1`, `FL-2.1.1`, `FL-3.2.1` and `FL-3.2.2` were only ever "covered" by questions that were
> about something else. Both lists were
> honest measurements; the first was taken through the wrong lens. The current one is printed by the
> build, so it stays current without anyone maintaining it here.

#### Not in A-10, deliberately

**The blueprint weights themselves.** §5.1's "verify before seeding" warning is still outstanding —
the chapter weights and the 65% pass line were taken from the CTFL v4.0 syllabus as read during A-06
and have never had the human check that warning asks for. That is a research task with a different
kind of answer than anything above, and folding it into a code PR would bury it. It needs its own
pass before anyone studies for the real exam from this bank.

> **Narrowed 2026-08-12.** The real syllabus PDF arrived and settled the version question, the
> 40-question total, and the whole learning-objective structure (§5.1, and A-10e below acts on it).
> It did **not** settle the weights or the pass line: syllabus §0.6 defers those to *"Exam Structures
> and Rules"* and *"Exam Structure Tables"*, and neither is in hand. So this stays open, but it is
> now **blocked on a document rather than on someone finding time** — which is a better place for it
> to sit, and worth saying plainly so nobody re-opens the research from scratch. **Owner action:
> obtain either document.** If neither can be had, the fallback is to state in the exam UI that the
> blueprint is TestForge's approximation, rather than to keep implying equivalence.
>
> **Closed 2026-08-18 — the owner supplied *Exam Structure Tables* v1.18, and the fallback was never
> needed.** The split was already correct. The exam UI gained a provenance line saying which numbers
> are the published ones, which is the opposite of the hedge planned here, and the split is now a
> build assertion against the document rather than a claim in prose. Full account in §5.1.
>
> **Narrowed to one number, 2026-08-13.** The owner supplied the exam structure: 40 questions, pass
> at 65% (26 of 40), 60 minutes plus 15 when the exam is not sat in the candidate's native language.
> `exams.ts` already matches all of it. **What is left is the per-chapter split alone** — 8 / 6 / 4 /
> 11 / 9 / 2 — which that line does not cover and which is the half that actually shapes which
> questions a paper draws. Deliberately not upgraded by association: it came from the same "authored
> from memory" process A-10e had to correct 70 refs and 73 K-levels out of, and the fallback above
> still stands until a document says otherwise. See §5.1.

**~~`markLessonDoneAction` does not validate its slugs.~~ Closed 2026-08-14.**
`claimAcademyProgress` resolved every slug through `findLessonTrack` and skipped what it couldn't
place; the direct toggle action did not, so a crafted call could write `LessonProgress` rows for
lessons that don't exist. It now resolves the pair through `getLesson(trackSlug, lessonSlug)` and
returns `{ ok: false }` when that misses — which also rejects a real lesson filed under the wrong
track, and makes the stored `trackSlug` the registry's rather than the caller's.

> **The first draft of the test passed against the unfixed build**, and is worth recording because
> the trap is not specific to this action. `markDone()` only calls `markLessonDoneAction` once
> `ensureSynced()` has set the client's `authed` flag; clicking the toggle straight after `goto`
> loses that race and persists through `claimAcademyProgress` instead — the path that already
> validated. The test was therefore exercising the wrong code and would have gone green forever.
> **TC-E2E-127** now waits for the sync round-trip and then asserts the captured request body is
> `["fundamentals","what-qa-does"]`, so losing the race fails the test instead of quietly passing
> it. Both directions were watched: with the guard removed the replay writes a `zzzz-qa-zzzz` row.

### A-11 — Sandbox checkers for the remaining eight `[x]`

> **Opened 2026-08-15**, after A-08's content half finished. Every content slice since the third
> deferred this with the same sentence — *that is a design question, not a writing task, and it
> should get its own work order rather than being smuggled into a content slice.* This is that work
> order. It is opened by re-reading the schema rather than by re-reading those deferrals, and the
> first finding contradicts them.

**The debt.** Eight lessons carry `sandbox: true` with no `SANDBOX_TASKS` entry, so each renders
A-04b's generic "Open your sandbox" callout instead of a "Start this exercise" button. All eight are
in published tracks. (Counted from source: 13 lessons carry `sandbox: true`, `SANDBOX_TASKS` has 5
keys, all T1 — see the recount box above.)

#### The finding that changes the shape of this work order

The standing note above says these exercises "grade a charter, a Postman collection, a dashboard
argument and a Playwright repository on the learner's own machine, **none of which is a DB row with
fields to inspect**". **That is wrong for six of the eight, and it was wrong when it was written.**
The models already exist:

| Lesson | Track | What the exercise asks | Inspectable as |
|---|---|---|---|
| `test-planning` | T2 | Write the plan against ShopMini and **link it to cases you have already written** | `TestPlan` → its runs → their results' cases (see A-11b: *not* a direct relation, which this row originally implied) |
| `exploratory-testing` | T2 | Run one 45-minute session **with a written charter and notes**, turn findings into a defect and ≥1 case | `Session.charter`, `timeboxMinutes`, `status`, `endedAt`; `SessionNote.kind`, `convertedType` |
| `metrics-that-mean-something` | T2 | Build the one-screen view — **at most five numbers** | `Dashboard` + `DashboardWidget` |
| `ci-github-actions` | T3 | Get a CI run uploading JUnit to the sandbox | `TestRun`, `ResultSubmission`, `TestRunResult` |
| `junit-to-testforge` | T3 | The capstone, same endpoint | as above |
| `portfolio` | T4 | Enable public sharing, with Cases/Runs/Reports on | `PublicShare.enabled`, `showCases`, `showRuns`, `showReports` |
| `api-testing` | T2 | Call the sandbox's own REST API | **Off-platform** — but see below |
| `first-playwright-test` | T3 | A Playwright test on the learner's machine | **Off-platform** |

Six of eight are the same shape as the five T1 checkers: fetch rows created since the coach panel
opened, hand them to a pure function in `checks-core.mjs`, return `{ passed, feedback }`. **The
design question this work order was reserved for turns out to apply to two lessons, not eight.**

Worth saying plainly because it is the lesson for next time: the deferral was written once and then
quoted forward through nine slices without anyone re-opening `schema.prisma`. `Session` and
`SessionNote` — charter, timebox, status, note kinds, and what each note was converted into — have
been in the schema since long before A-08.

#### Per-checker design

Criteria follow A-04b's rule: **forgiving about wording, strict about structure**, and feedback
always names what is missing.

**`exploratory-testing`** — the one the deferral was most wrong about. A session is a row with a
charter, a timebox and an end time.
Assert: a session created since the panel opened; `charter` over ~40 characters and naming both a
target and a purpose (the lesson's own "explore X with Y to discover Z" shape, matched loosely);
`timeboxMinutes` set; **`status = ENDED`** — an open session is an unfinished exercise; ≥3
`SessionNote` rows; ≥1 note of kind `BUG`; and at least one note with `convertedType` set, which is
the exercise's actual demand (*turn what you find into a defect and at least one case*).

**`test-planning`** — a `TestPlan` with a non-trivial `description` and **≥3 linked cases**, since
the lesson's whole argument is that scope stops being prose and starts being a list you can count.
Weakest of the six, because a plan's quality lives in its "Not covered" section and no checker can
grade prose; grade the structure and say so in the feedback.

> **Corrected 2026-08-15 in A-11b: "linked cases" is not a relation.** `TestPlan` has `runs` and no
> case link at all, so the shipped checker counts distinct case ids across the plan's runs' results.
> "Non-trivial `description`" also became something specific rather than a length: ≥80 characters
> **and** at least four of the worked example's six sections (scope, not-covered, risks,
> environment, entry, exit), matched on loose alternations so a learner's own headings pass.

**`metrics-that-mean-something`** — a `Dashboard` with **between 1 and 5 widgets**. The upper bound
is the exercise (*pick at most five numbers, and be able to defend deleting everything else*), and a
checker that enforced only a floor would invert the lesson. Note what cannot be checked: the
existing widget types are `passRateTrend | statusPie | coverageBar | flakyList | runVelocity |
textNote`, so **there is no raw case-count widget** for the lesson's "resist putting the case count
on the dashboard" warning to catch. The count bound is the checkable half; the reasoning behind each
number is not, and the feedback should say so rather than implying the dashboard was judged good.

**`portfolio`** — `PublicShare.enabled` true with `showCases` on, and the feedback should name the
sections that are still off rather than just failing.

**`ci-github-actions` and `junit-to-testforge`** — a `TestRun` in the sandbox whose results arrived
through `/api/v1/junit`.

> **The pass bar, decided — and it needs less machinery than the eleventh slice assumed.** That
> slice framed the choice as *any run / a run with ≥1 matched case / a matched run that is also
> green*, and named the third as a trap: the capstone deliberately asks the learner to produce a 422
> and a failing result on the way, so grading on green fails them for following the instructions.
>
> Reading `src/lib/result-ingest.ts` settles the first two as well. **`ingestResults()` returns 422
> *before* creating anything when nothing matched** (`if (!matched.length)` precedes `createRun`), so
> a `TestRun` in the sandbox with `source`/`origin` from the endpoint **already implies at least one
> matched case**. "Any run exists" and "a run with a matched case" are the same predicate. The
> checker is therefore: **a run created since the panel opened, with ≥1 result, and no assertion
> about its statuses** — three lines, no new plumbing, and no way to punish the learner for the 422
> the exercise asked them to produce.

**`api-testing` and `first-playwright-test`** — the two that are genuinely off-platform. Three
options, and the recommendation is the third:

1. *Nothing* — leave the generic callout. Honest, and leaves two published lessons visibly thinner.
2. *A proxy check* — for `api-testing`, a case or defect created **via the API** rather than the UI.
   `TestCase` has no "created via API" column, so this needs one, or an `AuditLog` inspection. Real
   work for a weak signal.
3. **Self-assessment against published criteria** — the coach panel renders the criteria as a
   checklist the learner ticks, with no server-side grading and no pass/fail claim. The lesson keeps
   its "Start this exercise" affordance, and the product does not pretend to know something it
   cannot. This needs a third `SandboxTaskTarget` kind (`{ kind: "self" }`) and a coach-panel
   branch; it does **not** need a checker.

#### Mechanism changes

- `SandboxTaskTarget` widens from `case | defect` to also cover `session`, `plan`, `dashboard`,
  `share`, `run`, and `self`. Each new kind is one `runChecker` branch and one Prisma `select` —
  the registry pattern does not change.
- **`since` needs re-examination for two of them**, because A-04b's rule (*only rows created after
  the learner opened the exercise count*) assumes append-shaped work. `PublicShare` is one row per
  project with `@unique projectId` — it has `updatedAt`, but a learner who enabled sharing before
  opening the panel would still fail a `createdAt >= since` filter. **Accept that row regardless of
  age**: enabling it once is the exercise, and there is nothing a stale row could replay. `Dashboard`
  is worse — it has **`createdAt` only, no `updatedAt`** — so a learner who edits an existing
  dashboard produces no timestamp to filter on. Either check the widgets' parent dashboard without a
  time filter, or add `updatedAt` to the model; the first is cheaper and the exercise is
  project-scoped to a sandbox nobody else touches.
- Every new checker gets good/bad fixtures in `scripts/academy-checks-selftest.mjs`, which runs under
  bare node in `prebuild`.
- **Assert the debt count in that selftest** rather than maintaining it in prose: the number of
  `sandbox: true` lessons without a `SANDBOX_TASKS` key is derivable, and this document got it wrong
  twice by adding to a tally by hand.

#### Slices

1. **A-11a** — mechanism: widen the target type, the `runChecker` branches, the `since` fix, and the
   selftest assertion. No new lesson tasks; the five existing checkers keep passing.

   > **Shipped 2026-08-15, with one deliberate change to this plan: it carries the `portfolio`
   > checker too.** A slice that widened the target type and added dispatch branches for six kinds
   > nothing calls would have been six pieces of unreachable code merged on the promise of a later
   > PR. Landing the simplest target (`share`) with the mechanism means every line of the slice is
   > exercised — including the `since` decision, since `PublicShare` is exactly the upsert-shaped
   > case that motivated it. A-11b therefore covers three checkers rather than four.
   >
   > **The e2e found a real bug that reading the code did not.** The coach panel is
   > `position: fixed` bottom-right, which was harmless for the five T1 exercises — they all land on
   > a tall case form whose controls are nowhere near that corner. The first exercise to land on a
   > short *settings* page put the panel directly on top of "Make this project public", the one
   > button the exercise asks the learner to press. Fixed generally rather than for this page:
   > while docked, the panel reserves its own height as `body` bottom padding (measured with a
   > `ResizeObserver`, since the panel grows with the hint and the feedback), so anything underneath
   > can be scrolled clear. Every future target kind inherits the fix.
   >
   > **It also caught four specs that publishing T5 had already broken** — TC-E2E-88, 90, 92 and 103
   > asserted that `istqb` was a draft: no `href` on its roadmap card, a 404 on its route, absent
   > from the sitemap. A-08's last slice published it and **those specs were not run before that PR
   > merged**. All four are updated here: 88 now asserts every one of the five tracks is a link, 90
   > and 92 moved their assertions to a slug that resolves to nothing (same code path, no dependency
   > on some track staying unfinished), and 103 stopped pinning the resume link to `fundamentals`,
   > which its own comment had already argued against doing with the lesson count.
   >
   > **The draft-route guarantee now has no live content to assert against.** With every track
   > published, "a draft has no route" is covered only by `getTrack()`'s filter and the
   > nonexistent-slug 404. TC-E2E-88 carries a note to re-add the real assertion the next time a
   > track lands in `draft`.
2. **A-11b** — the four T2/T4 row-shaped checkers: `exploratory-testing`, `test-planning`,
   `metrics-that-mean-something`, `portfolio`.

   > **Shipped 2026-08-15** (branch `feat/academy-a11b-row-checkers`), covering the three that were
   > left after A-11a took `portfolio` early. Three new target kinds (`session`, `plan`,
   > `dashboard`), three pure checkers, twenty-four selftest fixtures, and **TC-E2E-129**. The debt
   > assertion now derives 4 rather than 7.
   >
   > **The plan checker's design in this file was wrong, in the same way the deferral it replaced
   > was wrong.** The table above reads "`TestPlan` + its linked cases" and the per-checker section
   > asks for "**≥3 linked cases**" — but **there is no plan→case relation in the schema**.
   > `TestPlan` holds `runs`; a run holds `results`; a result references a case. The lesson body says
   > the same thing this document did ("a **Test Plan** object you attach real cases to"), so the
   > mistake is older than A-11. What shipped walks the two hops and counts *distinct* case ids
   > across the plan's runs, and the task text now tells the learner what the product actually asks
   > of them: create the plan, then create a run under it. **Re-reading `schema.prisma` was A-11's
   > own opening move, and it still only got applied to the models it went looking for.**
   >
   > **Three checkers grade the learner's best attempt, not their latest.** A session abandoned
   > after two minutes, a first plan with an empty description, a dashboard left at eleven widgets
   > while experimenting — each would have failed an exercise the learner had already satisfied on a
   > second try. The rule this makes explicit, and which the T1 checkers got for free by taking a
   > whole suite: when a target is one row rather than a collection, "which row" is a decision, and
   > "the most recent" is the wrong default.
   >
   > **The `since` exception `dashboard` needed is the one the work order predicted**, and it is
   > implemented as the cheaper of the two options: no time filter at all, rather than adding
   > `updatedAt` to the model. Safe here because `seedSandbox()` creates no dashboards, so anything
   > in a sandbox was built by its owner — recorded because that is a property of the *fixture*, not
   > of the model, and a future sandbox that seeds an example dashboard would silently break it.
   >
   > **`checkExploratorySession` is the one with real brittleness risk**, per §9 — it is the only
   > checker in the set that grades free text against a shape. Two fixtures exist specifically to
   > pin the boundary: a charter using none of the lesson's literal phrasing must pass ("Poke at
   > cart quantity limits with pasted values… looking for a way past 99"), and one naming a target
   > and an approach but no *information goal* must fail, because that distinction is what the
   > lesson's own self-check q1 turns on. TC-E2E-129 walks both against a live session.
3. **A-11c** — the two CI checkers, on the decided pass bar.

   > **Shipped 2026-08-15** (branch `feat/academy-a11c-ci-checkers`). One target kind (`run`), one
   > shared predicate, two feedback variants, and **TC-E2E-130**. The debt assertion derives 2.
   >
   > **`source` is what separates an uploaded run from a hand-made one**, and it works only because
   > the UI's create action sets no `source` at all, so a manual run takes the schema default. That
   > is a fact about `src/app/actions/runs.ts`, not a guarantee of the model — a future create form
   > that let a user pick a source would quietly widen this checker.
   >
   > **The CI variant says out loud that it cannot tell a GitHub runner from a curl.** Both are the
   > same POST, and `origin` is caller-supplied. Reported when present, never gated on. What proves
   > the workflow is that it ran without the learner watching, which no row records — the same
   > honesty the dashboard and plan checkers owe their exercises.
   >
   > **Found on the way, and not caused by this work:** `e2e-results/.api-key` was observed one run
   > stale against the database (row `tf_0891…`, file `tf_26b7…`), which 401s every upload. Four
   > specs read that file. TC-E2E-130 mints its own key instead, but the shared file is worth
   > chasing — it is a suite-wide flake, not an Academy one.
4. **A-11d** — self-assessment mode, and the two off-platform lessons adopting it.

   > **Shipped 2026-08-15** (branch `feat/academy-a11d-self-assessment`), **which closes A-11**. One
   > target kind (`self`), a coach-panel branch, `api-testing` and `first-playwright-test` adopting
   > it, and **TC-E2E-131**.
   >
   > **Both owner questions were answered before building.** Self-assessment is acceptable *provided
   > the panel never says "passed"* — it says "You have marked this done", followed by "Nothing was
   > verified". And a self-assessed exercise **counts toward lesson progress exactly as a checked one
   > does**, which is why no new state was added: it calls the same `markDone()`. The precedent that
   > makes this coherent is one the product already had — "Mark done anyway" has accepted unverified
   > completion since A-04b, so a separate class for self-assessment would have been a distinction
   > the rest of the feature does not draw.
   >
   > **Three things the UI must not do, all of them asserted:** no "Check my work" button (offering
   > one implies the product could grade it), no "Mark done anyway" (redundant — the checklist *is*
   > the gate), and the word "pass" nowhere in the panel. `runChecker` also refuses a `self` target
   > server-side, so a crafted call gets an honest refusal rather than a pass; that branch is not
   > user-reachable by construction and is defence-in-depth, not a tested path.
   >
   > **The docking rule changed for this kind only.** A-04b keeps the panel docked while the learner
   > is under their sandbox project — correct for every target whose work *is* a row in that project,
   > and wrong for this one, whose own criteria send the learner to Settings → API Keys. A `self`
   > task stays docked across the whole app, and its ticked criteria live in the same
   > `sessionStorage` record so the walk there and back does not empty the checklist.
   >
   > **The debt assertion changed shape rather than being deleted.** It was a countdown; it is now a
   > floor — *no* `sandbox: true` lesson may lack a `SANDBOX_TASKS` entry — plus a named list of the
   > two self-assessed slugs. The countdown would have been satisfied forever by doing nothing; the
   > floor fails the build the next time a hands-on lesson lands without an exercise, which is
   > exactly how the debt reached eight without anyone noticing.
   >
   > **Checked in a real browser at 375×667 with the hint open**, the panel's worst case: 524px tall
   > against a 667px viewport, fully on screen, with A-11a's reserved bottom padding keeping the page
   > underneath scrollable. Five criteria make this the tallest the coach has ever been.

#### Open for the owner — ~~open~~ **both answered 2026-08-15, before A-11d was built**

- ~~**Is self-assessment acceptable at all**, or is a lesson better left with the generic callout than
  given a checklist the product does not verify?~~ **Yes, with the checklist** — and the
  recommendation's condition is binding: the panel never says "passed".
- ~~**Should a self-assessed exercise count toward lesson progress** the way a checked one does?~~
  **Yes, identically.** Which is why A-11d added no new progress state.

**Definition of done:** all eight lessons render "Start this exercise"; six have real checkers with
selftest fixtures; two are explicitly self-assessed; the debt count is asserted by the build rather
than written in this file; and `e2e/academy.spec.ts` covers one new checker end to end, per §1.

> **Met, 2026-08-15.** All eight render "Start this exercise" (asserted as a floor, not a count);
> six have checkers with 31 new selftest fixtures across A-11b/c; two are self-assessed and pinned
> by name in the build; and the e2e went well past the one-checker bar — **TC-E2E-129** (session),
> **TC-E2E-130** (the CI pass bar, including a real 422 and a red run), **TC-E2E-131**
> (self-assessment). `academy.spec.ts` is 40 specs, green with `help-center.spec.ts` at 44/44.
>
> **What A-11 cost, against what it was reserved for.** The work order was opened on the argument
> that grading a charter, a Postman collection, a dashboard and a Playwright repo was "a design
> question, not a writing task". Re-reading `schema.prisma` cut that from eight lessons to two — and
> then A-11b found the *replacement* claim was wrong too, in the same way: "`TestPlan` + its linked
> cases" is not a relation either. Two rounds of the same mistake, both fixed by opening the schema
> instead of the previous paragraph.

### A-12 — Editorial layout for the Academy `[x]`

**Why.** Owner review, 2026-08-21: "kurang suka dengan design dan layout academy". Four directions
were mocked as working HTML against the real tokens and type stack, kept at
`docs/design/academy-redesign-directions.html`, and the editorial one was picked on 2026-08-22.
The other three are recorded there with their trade-offs — the gamified one ("Jalur") is the
direction §9 already rules out, since streaks and milestone unlocks are the engagement mechanics
this project deliberately excludes.

**Six problems it was chosen to fix**, all of them findable in the diff rather than in taste:

1. `mx-auto max-w-5xl` sat *inside* the app shell on all three Academy pages. On a 1900px screen
   the lesson rail began ~390px right of the sidebar with nothing in between, and the body it left
   over was ~740px.
2. The track page listed its lessons twice — `AcademyNav` down the left and the same lessons again
   as cards in the body.
3. The rail never read progress. `lessonProgress` has been per-lesson since A-05; the rail marked
   the current page and nothing else.
4. "Mark as done" and the next lesson waited at the bottom of eight minutes of prose and a quiz.
5. Everything was the same card — beta banner, outcomes, each lesson, "how to use this" — all
   `rounded-xl border-hairline bg-surface p-5`. Uniform weight is no hierarchy.
6. **Lesson bodies could not reflow.** `.tf-markdown p` sets `white-space: pre-wrap`, and lesson
   sources are hard-wrapped at ~78 columns like the prose files they are, so every authored newline
   rendered as a line break. The reading column was ragged at *any* width. This is the one that was
   invisible as a design problem and obvious as a CSS one.

**What changed.**

- `src/app/globals.css` gained a `.tf-lesson` block, applied alongside `.tf-markdown` on lesson
  bodies only: reading scale (1rem/1.75), display-face headings, pull-quote blockquotes, ruled
  tables instead of boxed ones, and `white-space: normal` (problem 6). Nothing else in the app
  moves — `.tf-markdown` is untouched.
- `RoadmapPage` and `TrackPage` are ruled indexes: a mono numeral in the margin, the title in the
  display face, status and duration in a right-hand column. `TrackPage` opens like a chapter — set
  numeral, kicker, oversized title, four facts — and no longer renders `AcademyNav` (problem 2).
- `LessonRail` and `TrackIndex` are new client components that read `readProgress()` and state each
  lesson's status *in words* — "Done" / "Reading now" / "Up next" / a duration (problems 3 and 5).
  Written rather than drawn, which is also what makes it survive a screen reader. Both take plain
  slug/title/minutes props: `@/content/academy` is `server-only` and must stay out of client code.
- The lesson page pins "mark as done" plus prev/next to the bottom of the viewport while the lesson
  is on screen (problem 4), and drops its `max-w-5xl` wrapper so the rail sits at the left edge of
  the content area with the measure on the prose (problem 1).
- `academyChrome` gained the strings all of this needed, in both languages: `track.position`,
  `track.contents`, the four fact labels, `lesson.position`, `lesson.nextUp`/`prevUp`, and
  `progress.reading`/`upNext`/`notStarted`.
- `TrackProgress` is finally passed `lang` on the track page; it had been rendering "1 of 13 lessons
  done" in English on `/id`.

**Deliberately not done:** the split theory/practice layout ("Studio", direction 3 in the mockup).
It is the strongest of the four and the one no other QA course could copy, but only 11 of 51
lessons have a sandbox task, so the practice pane would be empty on four fifths of the Academy.
It is worth revisiting when the checker coverage from A-11 grows, not before.

**Every `data-testid` on these pages is unchanged**, which is what keeps `e2e/academy.spec.ts`
honest across a rewrite of the markup it walks.

> **A-12 follow-up, 2026-08-22 (same day).** Owner testing found two things the
> first pass got wrong, both about where the text sits rather than what it says.
>
> **The lesson page had no frame.** Dropping `max-w-5xl` (problem 2 above) went
> one step too far and left the wrapper at `w-full`, so the article box ran to
> the right edge of the viewport while the prose inside it stopped at 68ch. The
> breadcrumb and the language toggle ended up at opposite ends of an invisible
> box twice the width of the text — at 1900px the toggle sat ~400px right of the
> last word — and the column read as stranded in the middle of the page. Worse,
> the roadmap centred a 768px column while the lesson page did not, so the block
> moved sideways on every navigation. `ACADEMY_SHELL`
> (`src/components/academy/shell.ts`) is now the one frame all four Academy
> surfaces use: 65rem, which is exactly a 224px rail + a 48px gutter + 47rem of
> prose. Measured at 1900px, roadmap, track and lesson now share both edges.
>
> **It lives under `src/components/`, not `src/lib/`, and that is load-bearing.**
> Tailwind's `content` globs cover `src/pages`, `src/components` and `src/app`.
> The constant started in `src/lib/academy/chrome.ts` next to the rest of the
> Academy's shared chrome, and the utility was simply never generated: the class
> name rendered into the HTML and the page laid out as though no max-width had
> been set. Nothing errors, nothing warns.
>
> **The type scale went up.** Lesson bodies 16px → 18px/1.72 in a 47rem column
> (653px → 736px of text), lesson `h1` 32–40px → 34–44px, body `h2`/`h3` 22/17px
> → 26/20px, lesson tables 15px → 17px, pull quotes 19px → 23px. Around them:
> roadmap intro and track tagline 18px → 21px, index titles 17/19px → 19/22px,
> and summaries, outcomes and the rail 14px → 15px. Academy chrome that is not
> reading matter — the mono labels, the beta banner — stayed where it was.
>
> **The language control got the globe icon** it had been missing, added to the
> icon system as `globe` and used by both switches: the Academy's own
> `AcademyLanguageLink` and the `LanguageSwitcher` on the auth and landing pages,
> whose only labels are the two-letter codes. Decorative, `aria-hidden`.


### Testing (applies to all)

Playwright specs in `e2e/academy.spec.ts`, continuing the `TC-E2E-*` sequence (last used 127,
global across all `e2e/*.spec.ts` files, per F-45): roadmap → lesson → quiz pass/fail; anonymous
progress survives reload; claim-at-signup; sandbox provisioning and one checker end to end; a full
exam run including auto-submit at timeout (clock injected, not waited out); session-aware shell on
`/academy` and `/docs/help` (A-09). Unit tests for `draw()`, ticket verification, every checker, and
the no-answers-in-bundle assertion. Per Part IV §1, no `A-xx` merges without its e2e.

---

## 9. Risks, open questions, deliberate exclusions

**The cost is content, not code.** ~70 lessons and ≥300 questions is the bulk of this project;
every work order above is a couple of days of engineering and weeks of writing. Mitigation:
`status: draft` lets tracks land incrementally; drafting with AI assistance is fine, but every
question needs a human review pass against its `syllabusRef`, because a plausible-looking wrong
answer key is worse than no exam at all.

**Checker brittleness** (§6.2) is the sharpest product risk. A checker that rejects correct work
destroys trust in one interaction. Every checker ships with unit tests over real good/bad
submissions, and the coach panel always offers "Mark done anyway" — the lesson is the point, not
the grader.

**Blueprint drift.** The ISTQB syllabus is versioned; when v4.1/v5 lands, `chapter`/`syllabusRef`
tags make the bank re-mappable, but it is real maintenance. `exams.ts` keeps the syllabus version
in the template slug (`ctfl-v4-full`) precisely so two versions can coexist.

**Open questions for the owner — all three answered, 2026-08-25.** They were written when the
Academy was a plan; two of them turned out to be asking about things the code had already settled,
and the third was answered by declining to build it. Kept in place with their answers rather than
deleted, because a question someone raised deserves a visible verdict.

1. ~~Should the sandbox count against any per-user project limits, and do self-hosters get Academy
   on by default or behind `ACADEMY_ENABLED`?~~ **Both halves: no.**

   The quota half asks about something that does not exist — there is no per-user or per-org project
   limit anywhere in TestForge, and no plan field on `Organization` for one to hang off. What the
   question was really reaching for is already an invariant: `Project.kind` plus `NOT_SANDBOX`, which
   the dashboard, `/projects`, global search and the app shell all spread into their `where`. If a
   quota is ever introduced it inherits that filter, because "the sandbox is not the learner's work"
   is the rule those listings already enforce. (One place had missed it — the F-41 console counted
   sandbox memberships in its `Projects` column, fixed the same day.)

   The flag half is declined outright rather than deferred. Academy costs nothing until someone
   opens it: the content is static, and the first DB row is written lazily on the first hands-on
   lesson. A flag, by contrast, is a permanent branch through routing, navigation, the sitemap, the
   i18n chrome and the SEO surface — each with its own e2e matrix. It gets built when somebody asks
   for it, and the cheap version of that ask ("hide the nav entry") is not the same thing as gating
   the routes.

2. ~~Certificates: name on the certificate — account name, or user-editable at issue time?~~
   **Answered 2026-08-25 — neither, and the question understated the problem: the name was not
   stored at all, so it followed the OAuth account retroactively onto certificates already shared.
   Frozen at issue *and* correctable by the holder. See A-07c.**

3. ~~Team view — should org admins see their members' Academy progress?~~ **Not built, and this is a
   decision rather than a deferral.**

   The B2B need the question names is already met, by the half of it that does not require watching
   anyone: certificates exist, and `/academy/me` lets their holder switch each link on or off. A team
   member who wants to show they finished a track sends a link, and the showing is *theirs to do*.

   What a manager's dashboard would add on top of that is exactly the surveillance half — progress
   per lesson, when someone last opened the Academy, and, decisively, `ExamAttempt` keeps the
   attempts that **failed**. Once a manager can see those, the practice exam stops being a place to
   find out what you do not know yet; people stop sitting it, or start gaming it, and the bank whose
   integrity A-10 spent five sub-work-orders defending is measuring something else. The cost is not
   the code — `Organization`, `organizationId` and the `ADMIN` role are all already there, which is
   precisely why this needed deciding rather than leaving to whoever picks it up.

   **If it is ever wanted**, the shape to build is an org page showing only the certificates members
   have chosen to publish: opt-in, credential-only, no per-lesson detail, no failed attempts, no
   activity timestamps. That carries the whole "upskill your QA team" pitch without opening the
   surface this note is about.

**Deliberately excluded, and why:** video lessons (hosting, production cost, and they age badly
against a text corpus that is diffable in PRs); an in-app content CMS (see §2.1 — git *is* the CMS,
and an editor UI means auth, drafts, media, preview and migrations for a handful of authors);
leaderboards and streaks (they optimise for engagement metrics rather than learning, and invite
gaming); paid tiers of any kind (TestForge's whole pitch is "100% free forever" — Academy must not
be the thing that puts a price tag on the landing page).
