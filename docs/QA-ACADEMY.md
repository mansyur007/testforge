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
> A-06 … A-08 planned. Created 2026-08-10.
> Work orders are numbered `A-01 … A-08` (a new track alongside `F-xx`/`L-xx` in
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
- [8. Work orders A-01 … A-08](#8-work-orders)
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

Every lesson and track carries `status: "draft" | "published"`. Drafts are excluded from
`generateStaticParams` and, with `dynamicParams = false`, **have no route at all** — a half-written
track can be merged and 404s in production.

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

| Ch | Topic | Questions |
|---:|---|---:|
| 1 | Fundamentals of Testing | 8 |
| 2 | Testing Throughout the SDLC | 6 |
| 3 | Static Testing | 4 |
| 4 | Test Analysis and Design | 11 |
| 5 | Managing the Test Activities | 9 |
| 6 | Test Tools | 2 |

> **Verify before seeding.** These figures are taken from the v4.0 syllabus and its Exam Structure
> & Rules document. The implementer must re-check the current published numbers (and whether v4.0
> is still current) before writing `ctfl-v4-full` — the blueprint is one object in
> `src/content/academy/exams.ts`, so a correction is a one-line change, but shipping wrong weights
> makes the whole simulation worthless.

Bank target: **≥300 questions**, ≥5× the number drawn per chapter, each tagged `chapter`,
`kLevel` (K1/K2/K3), `syllabusRef` (e.g. `FL-4.2.1`), with a written explanation and, where the
answer is a technique, a worked example.

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

### A-06 — Exam engine + ISTQB practice exam `[ ]`

`ExamAttempt` model; `src/lib/academy/exam.ts` (`sanitizeQuestion`, `draw`, signed ticket
issue/verify, `gradeAttempt`); the question bank (≥300, six chapter files); six chapter quizzes
and `ctfl-v4-full`; exam UI (navigator, flag, timer, warnings, auto-submit); result screen with
per-chapter breakdown and full review; attempt history.

**Acceptance:** server-side clock wins (submit with a tampered client time → rejected, partial
grade); the same `seed` reproduces the same paper; drawn chapter counts match the blueprint over
1000 seeded draws (unit test); an anonymous attempt writes zero rows.

### A-07 — Certificates & shareable badge `[ ]`

`Certificate` model, HMAC-derived serial, `/academy/certificate/[serial]` public page with a
generated OG image (follow `src/app/opengraph-image.tsx`), issued on track completion and on a
passing exam. Revocable. Disclaimer per §7.4.

### A-08 — Content build-out & localised routes `[ ]`

T2/T3/T4 to `published`; the remaining sandbox checkers; the T3 CI capstone;
Indonesian lesson bodies; and — if ID organic traffic justifies it — `/id/academy/**` with
`hreflang`, decided on A-03's measured numbers rather than up front.

### Testing (applies to all)

Playwright specs in `e2e/academy.spec.ts`, continuing the `TC-E2E-*` sequence (last used 87, per
F-45): roadmap → lesson → quiz pass/fail; anonymous progress survives reload; claim-at-signup;
sandbox provisioning and one checker end to end; a full exam run including auto-submit at timeout
(clock injected, not waited out). Unit tests for `draw()`, ticket verification, every checker, and
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

**Open questions for the owner:**

1. Should the sandbox count against any per-user project limits, and do self-hosters get Academy
   on by default or behind `ACADEMY_ENABLED`? (Recommendation: on by default; it costs nothing
   until someone opens it.)
2. Certificates: name on the certificate — account name, or user-editable at issue time?
3. Team view — should org admins see their members' Academy progress? It is a real B2B hook
   ("upskill your QA team") but also a surveillance surface; opt-in per user if built at all.

**Deliberately excluded, and why:** video lessons (hosting, production cost, and they age badly
against a text corpus that is diffable in PRs); an in-app content CMS (see §2.1 — git *is* the CMS,
and an editor UI means auth, drafts, media, preview and migrations for a handful of authors);
leaderboards and streaks (they optimise for engagement metrics rather than learning, and invite
gaming); paid tiers of any kind (TestForge's whole pitch is "100% free forever" — Academy must not
be the thing that puts a price tag on the landing page).
