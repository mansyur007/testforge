# TestForge QA Academy — Content Audit

> **Date:** 2026-08-23 · **Auditor:** Claude (manual read of the content trees plus exhaustive
> scripted scans; exact coverage in §2) · **Scope:** all 51 published lessons in English, all 51
> Indonesian translations, the 255-question exam bank, the learning flow across the five tracks,
> the lessons' claims about TestForge as a product, and the certificate pipeline.
>
> **Verdict up front.** The Academy is in very good shape. The English content is consistently
> excellent, the Indonesian translation is faithful and idiomatic with full 51/51 coverage, the
> exam bank's structural properties are machine-checked on every build, and the certificate page
> satisfies every constraint §7.4 of `docs/QA-ACADEMY.md` imposes. The defects found are small
> and enumerable: **one content-accuracy problem** (two T3 lessons teach TestForge API endpoints
> that do not exist), **one mechanical class of translation defects** (19 lost backslash escapes
> that corrupt rendered code blocks in the Indonesian tree), **three meaning-shift translation
> slips**, and **one terminology inconsistency** ("laporan bug" vs "laporan cacat" vs "catatan
> cacat"). Everything else in this document is either a decision to make or an observation.
> Remediation is planned as four small work packages in §5.

---

## 1. Scope and questions asked

The audit answers the six questions it was commissioned with:

1. **English material** — is each lesson technically correct, well-written, and honest?
2. **Indonesian material** — is the translation faithful, idiomatic, and does it follow the
   agreed register (formal *Anda*, common English QA/dev terms kept in English, slugs English)?
3. **Inter-lesson coherence** — do lessons reference each other correctly, and does each track's
   order follow a sound general learning progression?
4. **TestForge tie-in** — where a lesson claims something about TestForge (a feature, an
   endpoint, a screen), is the claim true of the shipped product?
5. **Certificates** — does the certificate pipeline (issuance, serial, public page, OG card)
   do what the plan requires, and does the copy say what §7.4 demands?
6. **Exam bank** — are the 255 questions structurally sound and (by sample) correct?

Out of scope: the exam engine mechanics (covered by `academy-exam-selftest` and A-10's e2e
suite), the sandbox checker implementations (covered by `academy-checks-selftest` and A-11),
and visual rendering of the lesson pages.

## 2. Method — how this audit was performed, and how to repeat it

**Pass 0 — automated baseline.** All five existing check scripts were run first (Node ≥ 18):

```bash
node scripts/academy-i18n-check.mjs        # 51/51 lessons translated, structure parity
node scripts/academy-bank-check.mjs        # 255 questions; pools, LO floor, guessing defenses
node scripts/academy-trademark-check.mjs   # ISTQB notice on every track that names the scheme
node scripts/academy-exam-selftest.mjs     # draw determinism, grading, server clock
node scripts/academy-certificate-selftest.mjs  # serial derivation properties
```

All five were green at audit time. Everything those scripts assert was treated as **already
assured** and not re-verified by hand; this audit concentrates on what no script checks.

**Pass 1 — manual read, with the coverage stated exactly** (so a future auditor knows what was
and was not eyeballed):

| Tree | Coverage |
|---|---|
| English lessons | **51 / 51 read in full**, all five tracks |
| Indonesian, T1–T3 | **37 / 37 read in full**, side-by-side with the English original |
| Indonesian, T4–T5 | 14 lessons **sampled** — every code block, every table, and the sections carrying the technical claims; `beyond/performance-testing`, `beyond/ai-in-qa`, `beyond/portfolio`, `istqb/ch1-fundamentals` and `istqb/ch4-test-analysis-design` were read at length |
| Both trees, mechanical scan | **113 / 113 `.ts` files** (56 English + 57 Indonesian), exhaustive — see Pass 3 |

The three meaning-shift slips in §4.2 were all found in the full-read portion, at a rate of
roughly one per twelve lesson pairs; extending the full read to T4–T5 would plausibly surface
one or two more, and is the obvious follow-up if the owner wants zero residual risk there.
Notes were kept per lesson.

**Pass 2 — terminology sweep.** `grep` counts across `src/content/academy/translations/id/`
for ~60 term pairs (English term vs Indonesian calque) to find translation-policy drift that a
per-lesson read can miss. Raw counts are in §4.2.

**Pass 3 — mechanical scans.** Two small Node scripts (reproduced in Appendix A) scanned both
content trees for lone backslashes inside template literals — the class of authoring mistake
where `\x` was written where `\\x` was needed, so the rendered page silently drops or misuses
the escape. The English tree is clean; every hit in the Indonesian tree is listed in §4.3.

**Pass 4 — product-claim verification.** Every "Where TestForge fits" claim naming a concrete
feature, route, or behaviour was checked against the code: Prisma models, `src/app/api/v1/**`
routes, the junit ingest contract, public sharing, and the AI-assist DRAFT behaviour.

**Pass 5 — exam bank sampling.** The bank's structural properties are build-asserted (see
§4.6), so sampling targeted the one thing machines cannot check: answer-key correctness.
All computational K3 questions found by pattern in chapters 4–5 were re-derived by hand, plus
a spread of K1/K2 questions in chapter 3.

**Pass 6 — certificate pipeline read.** `certificates-core.mjs`, `certificates.ts`, the public
page, and the OG image were read in full against §7.4 and the A-07 work order.

## 3. What is already assured by the build (do not re-audit by hand)

Worth recording so future audits don't redo machine work:

- **Translation structure**: `academy-i18n-check.mjs` asserts 51/51 coverage, that question ids
  and choice ids match the English bank (a translation cannot move an answer key), and that the
  two ISTQB disclaimers exist and are not copies of each other.
- **Exam bank structure**: `academy-bank-check.mjs` asserts pool multiples (7× ch4/ch5, 5×
  elsewhere), ≥3 questions per learning objective across all 64 LOs, that every `syllabusRef`
  exists / belongs to its chapter / carries the syllabus's own K-level, that the blueprint
  matches ISTQB's published *Exam Structure Tables* v1.18, and that both the first-choice and
  longest-choice guessing strategies stay near chance and pass 0/300 simulated papers.
- **Trademark**: `academy-trademark-check.mjs` fails the build on any track naming ISTQB/CTFL
  without `trademarkNotice`.
- **Answer-key isolation**: `server-only` on every module carrying `correct`/`explanation`.
- **Certificates**: serial determinism, field separation, alphabet distribution, and the
  golden vector are self-tested in `prebuild`; TC-E2E-117–120 cover issuance, completeness
  gating, hide/unhide, and tenant isolation end-to-end.

## 4. Findings

Severity scale: **F-HIGH** misleads a learner following the material as written · **F-MED**
visible defect, workaround obvious · **F-LOW** cosmetic or consistency · **DECISION** a
trade-off to settle, not a bug · **OBS** observation, no action strictly required.

### 4.1 English content (T1–T5)

**Verdict: excellent, no correctness defects found.** All 51 lessons were read in full. The
material is technically accurate (including the details that usually go wrong in QA courses:
2-value vs 3-value BVA, 0-switch vs 1-switch coverage, 401/403/404 semantics, `expect(await …)`
races, k6 `check()` vs thresholds, WebKit-on-iOS, Safari's 7-day storage eviction, the ISTQB
v4.0 changes). Cross-references between lessons are accurate in both directions — later lessons
cite earlier ones correctly ("the locators lesson called this out…") and never cite forward
material as already taught. The single running example (ShopMini) is used consistently across
all five tracks, and the T3 capstone's description of the `/api/v1/junit` contract was verified
to match the implementation exactly (params `project`/`name`/`source`/`origin`/`env`; statuses
400/401/404/422; response fields `runId`/`runUrl`/`matched`/`automated`/`unmatched`/`summary`;
the deliberate 404-for-non-member behaviour).

One documentation-drift note, not a content defect:

- **OBS-1 · `docs/QA-ACADEMY.md` §4 curriculum vs shipped content.** §4 still lists
  *use-case testing* as T1 content and sketches ~70 lessons; the shipped Academy is 51 lessons
  and T1 has no use-case-testing lesson (consistent with ISTQB dropping it from CTFL v4.0,
  which the bank's own A-10e audit notes). §4 deserves a one-paragraph "as shipped" correction
  so the plan stops disagreeing with the product.

### 4.2 Indonesian translation — quality and terminology

**Verdict: high quality.** The register is consistently formal *Anda*; sentences are idiomatic
rather than word-for-word; internal links are correctly localised to `/id/...` in every file
(verified by scan: zero `](/academy/` leaks in the ID tree, zero `](/id/` leaks in the EN
tree); code samples are deliberately kept in English (correct — learners will meet English
tooling); and the answer-key-safety design means no translation can alter grading.

**Terminology policy compliance** ("common English terms stay English") is largely followed —
kept-English counts across the ID tree: *test case* 62, *test plan* 17, *decision table* 14,
*locator* 104, *environment* 79, *unit test* 20, *pipeline* 18, *pull request* 14, *smoke
test* 4, *checklist* 10, *stakeholder* 10, *happy path*, *coverage* (as a syllabus term), etc.
The deviations worth acting on:

- **F-MED-1 · "bug report" has three competing translations.** "laporan bug" (8 files, incl.
  the `bug-reports` lesson title), "laporan cacat" (9 files, incl. `fundamentals/index.ts`
  outcomes), and one "catatan cacat" (`translations/id/fundamentals/bug-reports.ts:134`).
  The same lesson pair even disagrees with itself: `writing-test-cases` ID ends by pointing at
  "laporan cacat …" while the next lesson's ID title is "Menulis **laporan bug** …".
  *Recommendation:* standardise on **"laporan bug"** (matches the kept-English policy and
  everyday Indonesian QA usage) everywhere except ISTQB-track prose where "defect report" is
  the syllabus term — there, keep English "defect report" on first use with "laporan bug"
  allowed after.
- **F-LOW-1 · Mixed pairs used interchangeably.** *asersi* 117 vs *assertion* 17; *cakupan* 104
  vs *coverage* 14; *cabang* 14 vs *branch* 19 (git contexts); *pemangku kepentingan* 6 vs
  *stakeholder* 10; *nilai batas* 9 vs *boundary value* 10; *kait* 1 (contract-testing's
  provider-state hook) vs *hook* 5; one stray *daftar periksa* (`test-levels.ts:73`) vs
  *checklist*; one stray *tabel keputusan* gloss. None of these confuses meaning — most calques
  are standard Indonesian — but each pair should have one canonical choice. *Recommendation:*
  add a short glossary (§5, WP-3) and sweep once.
- **F-LOW-2 · Formal-register lexical choices.** *berkas* (71) for *file*, *basis data* (30)
  for *database*, *unggah/unduh* for *upload/download*. These are consistent within the tree,
  so they are a style decision rather than a defect — but they sit at the formal end of
  Indonesian tech writing, where practitioner usage is overwhelmingly *file* / *database* /
  (mixed) *upload*. Decide once in the glossary; if changed, it is a mechanical sweep.
- **F-LOW-3 · "pemeriksaan penyehat"** for *sanity check*
  (`translations/id/fundamentals/boundary-value-analysis.ts:46`) is an awkward coinage; keep
  "sanity check".

**Meaning-shift slips found by the full read** (all small, all worth fixing):

- **F-MED-2 · `translations/id/fundamentals/test-types.ts` (q2, choice c).**
  "Pengujian performa atas halaman-halaman **terlambat**" — EN is "the **slowest** pages";
  *terlambat* means "late/overdue". Should read "halaman-halaman **paling lambat**".
- **F-MED-3 · `translations/id/fundamentals/equivalence-partitioning.ts` (~line 48).**
  "…justru karena itulah **keenamnya** menemukan bug" — EN says **P4–P6** (three partitions)
  are the bug-finders, not all six. Should be "**ketiganya**".
- **F-LOW-4 · `translations/id/fundamentals/seven-principles.ts` (§7).** "perangkat lunak
  nyaris tanpa cacat yang tidak diinginkan siapa pun" parses as "defects nobody wants";
  EN means the *software* is unwanted. Suggest "perangkat lunak yang nyaris tanpa cacat namun
  tidak diinginkan siapa pun".

### 4.3 Indonesian translation — lost backslash escapes (mechanical, complete list)

**F-MED-4.** Inside a TypeScript template literal, `\x` is consumed by the string parser, so an
author who copies EN `\\x` as `\x` produces a rendered page missing the backslash. A scripted
scan of both trees (Appendix A) gives an exact tally: the **English tree is clean (0)**, and the
Indonesian tree has **19 lost escapes on 17 lines across 7 files** — 8 mid-line and 11 trailing,
in two sub-classes:

*Sub-class A — escape lost in rendered code/text:*

| File | Line | Renders as | Should render as |
|---|---|---|---|
| `translations/id/automation/assertions-and-waiting.ts` | 68 | `/​/projects/​/[a-z0-9]+$/` | `/\/projects\/[a-z0-9]+$/` |
| same | 177 | `//projects/` | `/\/projects/` |
| same | 288 (quiz choice d) | `//projects/` | `/\/projects/` |
| `translations/id/automation/first-playwright-test.ts` | 92 | `//dashboard/` | `/\/dashboard/` |
| `translations/id/automation/framework-design.ts` | 84 | `/global.setup.ts/` | `/global\.setup\.ts/` |
| `translations/id/fundamentals/state-transition-testing.ts` | 33 | `| Dari  Event |` | `| Dari \ Event |` |

*Sub-class B — trailing `\` at end of line = JS line continuation, so the newline is swallowed
and a multi-line shell command renders as one long merged line:*

| File | Lines | Affected block |
|---|---|---|
| `translations/id/automation/junit-to-testforge.ts` | 53–56 | the capstone's main `curl` upload |
| same | 142–145 | the CI-workflow `curl` upload |
| `translations/id/beyond/contract-testing.ts` | 164–165 | `pact-broker can-i-deploy` |
| `translations/id/beyond/security-for-testers.ts` | 64 | `curl -X DELETE …` |

Sub-class A corrupts regexes a learner will copy (`//projects/` is not the regex the prose
discusses); sub-class B is cosmetic-but-ugly on the **capstone lesson of the automation
track**, the single most important code block in the Indonesian Academy. The fix is purely
mechanical: double every backslash listed above. Adding the Appendix A scan to
`academy-i18n-check.mjs` prevents recurrence (§5, WP-1).

### 4.4 Learning flow and inter-lesson coherence

**Verdict: sound, with one deliberate gap to decide on.**

- **Within-track order** follows a defensible pedagogy in all five tracks:
  T1 role → process → levels/types → principles → four design techniques → the two daily
  artifacts → the sprint. T2 planning → risk → exploration → oracles → HTTP → API → SQL →
  compatibility → accessibility → NFR → metrics → reporting. T3 decide → code → first test →
  locators → waits → structure → data → API layer → CI → capstone → flakiness → handover.
  T4 specialisms then career. T5 mirrors the six syllabus chapters then strategy.
- Every lesson's closing **"Next:"** pointer was checked against the track index arrays: all
  50 pointers match the actual next lesson, and each track-closing lesson hands off to the
  correct next track (localised to `/id/...` in the Indonesian tree).
- **Cross-track references** are accurate and pedagogically deliberate (T3 locators builds on
  T2 accessibility; T3 flaky-tests builds on T3 test-data and T2 metrics; T5 chapter lessons
  link back to the T1 technique lessons for teaching while keeping the exam-shaped counting
  local). No forward references to untaught material were found.
- **DECISION-1 · Indonesian exam links.** EN chapter lessons end with a clickable
  "[Chapter N quiz →](/academy/istqb/practice-exam/chapter/N)". The ID versions render the
  same path as an *unclickable code span*, because the exam simulator has no `/id` routes and
  `academy-i18n-check` deliberately forbids `/academy/...` markdown links in ID files (the
  policy is documented in `translations/id/istqb/ch1-fundamentals.ts:3–8`). This is a real UX
  gap for Indonesian learners — 7 occurrences (ch1–ch6 + exam-strategy) at the exact moment
  the lesson says "drill it". Options: **(a)** build `/id` exam-simulator routes (largest);
  **(b)** carve an explicit exception in the i18n check for the `practice-exam` sub-tree and
  hyperlink the EN route with the existing "simulator is in English" note (small, recommended);
  **(c)** status quo. This is a product decision, so it is filed here rather than fixed.

### 4.5 TestForge tool tie-in

**Verdict: the strongest part of the design, with one accuracy defect.** Every track ends its
lessons with a "Where TestForge fits" section, 13 lessons carry sandbox exercises, and the
claims were verified against the product:

Verified true: the `TestPlan` object (test-planning); Sessions/notes → defects → cases flow
(exploratory-testing; `Session`/`SessionNote`/`Defect` models); tags/saved filters (`compat`,
`a11y`, `perf`/`sec`/`robustness`, `contract` recommendations); per-environment runs
(`Environment` model); `GET /api/v1/openapi`, `GET/POST /api/v1/projects/<slug>/cases` and API
key scopes (api-testing); the entire junit capstone contract (§4.1); AI-assist inserting
generated cases as `DRAFT` (`src/app/actions/ai.ts:133`); public sharing with per-section
toggles, guessable-slug honesty, `noindex` default, and the never-exposed list (portfolio;
`PublicShare` model + `src/app/public/[slug]/**`). All 13 `sandbox: true` lessons have coach
tasks in `src/content/academy/sandbox.ts`; 11 have DB checkers and 2 (`api-testing`,
`first-playwright-test`) are deliberately self-assessed with checklist criteria — documented
as A-11d, not a gap.

- **F-HIGH-1 · T3 lessons teach TestForge endpoints that do not exist.** Two lessons use
  API paths that look like TestForge's real API (`/api/v1/...` on a TestForge-adjacent
  example) but do not exist on the product:
  - `tracks/automation/test-data.ts` (fixture example, ~lines 79–97, and the "API not UI"
    section): `request.post("/api/v1/projects", …)` and
    `request.delete("/api/v1/projects/${id}")` — **there is no `/api/v1/projects` collection
    route** (no `src/app/api/v1/projects/route.ts`; only `/api/v1/projects/[slug]/**`).
  - `tracks/automation/api-automation.ts`: examples against `/api/v1/cases` and
    `/api/v1/suites/s_123`, and the closing section explicitly says "Practising against
    `/api/v1/projects` and `/api/v1/cases` **in your sandbox project**" — neither path shape
    exists; the real shape is `/api/v1/projects/<slug>/cases`.
  A learner who follows the closing instruction gets 404s and no explanation. T2's
  `api-testing` lesson uses the correct full paths, so this is an internal inconsistency as
  well as an accuracy defect. Both EN and ID are affected identically.

  What makes this more than a cosmetic slip is that `api-automation` explicitly attributes the
  scheme to the product: *"An API key from the environment is the simplest correct answer, and
  it is what **TestForge itself expects**"* (ID: *"…dan itulah yang diharapkan TestForge
  sendiri"*) — sitting two lines above `viewer.delete("/api/v1/suites/s_123")`. The reader has
  been told, in the same breath, that these are TestForge's endpoints.

  *Fix options:* use the real project-scoped paths in the examples (preferred — the extra path
  segment costs nothing and keeps the sandbox exercise honest), or reframe the snippets
  explicitly as "your application under test, not TestForge". Either way, correct the
  api-automation closing sentence naming `/api/v1/projects` and `/api/v1/cases`.

### 4.6 Exam bank (255 questions)

**Verdict: structurally machine-assured; sampled content correct.** The bank was already
audited internally against the real CTFL v4.0.1 syllabus (A-10e; 70 `syllabusRef` corrections,
K-levels now derived from the syllabus data in `src/lib/academy/syllabus-los.mjs`), and both
guessing exploits (position bias, longest-answer bias) were priced and closed (A-10a, A-10d).
This audit's sampling found **zero wrong answer keys**: all hand-recomputed K3 questions
(0-switch 2/3 ≈ 67%; 1-switch pair-count 3 for the five-transition terminal model; statement
coverage 16/20 = 80%; branch coverage 4/6 ≈ 67%; three-point estimate (10+60+26)/6 = 16) are
correct, with explanations that name the distractor logic. Chapter 3 K1/K2 samples are clean
and original in phrasing. The ISTQB-track lessons' stated per-section LO counts (14/10/8/14/
16/2) match the syllabus data file. No copyright-proximity concerns were observed in any
sampled stem — scenarios are ShopMini-flavoured originals, per §7.2.

Residual (accepted) risk, for the record: ~240 of 255 answer keys were not individually
re-derived in this audit; the build cannot check answer correctness, only structure. A rolling
"read 20 questions per release" habit would retire this risk cheaply.

### 4.7 Certificates

**Verdict: compliant and carefully built.** Checked against §7.4 and A-07:

- The public page (`src/app/academy/certificate/[serial]/page.tsx`) reads
  "TestForge QA Academy — Track Completion / Practice Exam Pass", shows the best passing
  score labelled as such, and carries a two-paragraph disclaimer **on the certificate card
  itself**: "not a professional certification … confers no ISTQB® credential", plus the full
  ISTQB notice on exam certificates. `noindex` on the page, deliberately not in robots.txt so
  share cards still render. Hidden certificates 404 (holder privacy) rather than announcing
  revocation.
- Issuance rules verified in `src/lib/academy/certificates.ts`: full paper only (chapter
  quizzes excluded, documented why), `scorePct` = best passing score / `issuedAt` = first
  earned, race-safe double-issue via the unique index, tenant-scoped hide/unhide.
- Serial design (`certificates-core.mjs`): HMAC-derived, Crockford base32 (no I/L/O/U), 80
  bits as the access control, NUL-joined fields — all self-tested in prebuild.

Three low-stakes observations:

- **OBS-2 · Dev-secret fallback.** `const SECRET = process.env.AUTH_SECRET ?? "testforge-dev-secret"`
  in `certificates.ts:40`. If `AUTH_SECRET` were ever unset in production, serials become
  derivable from public source + a userId. NextAuth makes a missing secret unlikely in
  practice; still, throwing in production when unset is a two-line hardening.
- **OBS-3 · OG card wording.** The share card shows heading/holder/subject/score/serial; the
  "not a professional certification" line appears only on the no-serial fallback card. §7.4 is
  satisfied by the page, but the card is what most viewers see first — a short footer line on
  the normal card ("Practice record") would close the gap between the image and the page.
- **OBS-4 · Certificate page is English-only** (no `/id` variant). Defensible for a shareable
  credential; recorded so it is a choice rather than an accident.

## 5. Remediation plan — work packages, in order

Sized so each is one small PR. None blocks the others except WP-1 before WP-3 (both touch the
same ID files; do the mechanical fixes first so the terminology sweep diffs stay readable).

**WP-1 · Fix the mechanical translation defects (F-MED-2/3/4, F-LOW-4).** ~1 hour. **Done
2026-08-23** — all four steps; the recurrence guard is assertion (8) of
`scripts/academy-i18n-check.mjs`, and the Appendix A tally now reads 0 for both trees.
1. Double every backslash listed in §4.3 — 19 escapes on 17 lines in 7 files. For sub-class B,
   replace each trailing `\` with `\\`; for sub-class A, replace `\/`→`\\/`, `\.`→`\\.`,
   `\ `→`\\ `. Re-run the Appendix A tally afterwards; it must report 0 for both trees.
2. Apply the three wording fixes: *terlambat*→*paling lambat* (test-types), *keenamnya*→
   *ketiganya* (equivalence-partitioning), and the seven-principles §7 rephrase.
3. **Prevent recurrence:** port the Appendix A scan into `scripts/academy-i18n-check.mjs` as a
   new assertion ("no lone backslash escapes inside a lesson body"), so the class cannot come
   back. Verify by re-introducing one defect and watching the check fail.
4. Verify with `node scripts/academy-i18n-check.mjs` and by opening the four affected `/id`
   lessons in the preview.

**WP-2 · Correct the T3 endpoint inaccuracy (F-HIGH-1).** ~1–2 hours. **Done 2026-08-23** —
the preferred option: real project-scoped paths in both lessons, both languages. Switching to
real paths also forced three response-shape claims to be corrected (the 201 body, the error
envelope, and a 422 that the lesson called a 404), since a snippet that names a real endpoint
inherits that endpoint's real behaviour.
1. In `tracks/automation/test-data.ts` (EN + ID): change the fixture example to a real shape —
   `POST /api/v1/projects/{slug}/cases` with a delete of the created case — or explicitly label
   the snippet as "your application under test" and use a neutral path (`/api/orders`).
   Preferred: real TestForge paths, since the lesson's closing section points at the sandbox.
2. In `tracks/automation/api-automation.ts` (EN + ID): same treatment for `/api/v1/cases` and
   `/api/v1/suites/s_123`, and rewrite the closing sentence to name
   `/api/v1/projects/<slug>/cases` (matching T2's api-testing lesson).
3. Re-read the T3 capstone to confirm no other lesson inherits the wrong shape (audit found
   none, but the diff should confirm).

**WP-3 · Terminology: one decision, one glossary, one sweep (F-MED-1, F-LOW-1/2/3).** ~2 hours.
**Done 2026-08-23** — the proposed set, with the owner keeping the formal register (F-LOW-2:
*berkas/basis data/unggah/unduh* stay). Glossary at `docs/ACADEMY-ID-GLOSSARY.md`; the retired
spellings are build-enforced by assertion (9) of `academy-i18n-check.mjs`. The sweep turned out
smaller than §4.2's counts suggest: the *assertion*, *coverage*, *branch* and *boundary value*
pairs were already correct under the rule, since every English hit was inside a named term
(*web-first assertion*, *statement coverage*, git *branch*). 25 substitutions in 14 files — 8 to
*laporan bug*, 7 to English *defect report* in the ISTQB track, 6 to *stakeholder*, 4 singletons. The
sweep also surfaced one register slip no rule covered — *tempatkan **dirimu*** in
`beyond/contract-testing`, the `-mu` clitic form of the `kamu` the check has always banned.
1. Decide the canonical set (proposed): **laporan bug**; **assertion → asersi** everywhere
   (already dominant); **coverage → cakupan** in prose but keep *coverage* inside syllabus
   terms ("statement coverage"); **branch** (git) stays English, *cabang/bercabang* allowed
   for code-flow prose; **stakeholder** stays English; **boundary value** stays English on
   first use with *nilai batas* allowed after; **hook** stays English; **checklist** stays
   English; **sanity check** stays English. Leave *berkas/basis data/unggah/unduh* as-is
   unless the owner prefers practitioner register (then: file/database/upload/unduh→download).
2. Record the decisions in a short `docs/ACADEMY-ID-GLOSSARY.md` (or a comment block in
   `translations/id/index.ts`) so future slices stop re-deciding.
3. Mechanical sweep of the ID tree against the glossary; the grep counts in §4.2 are the
   worklist.

**WP-4 · Decisions and small hardenings (DECISION-1, OBS-1/2/3).** ~1 hour once decided.
1. Settle DECISION-1 (Indonesian exam links) — recommended option (b): allow
   `/academy/istqb/practice-exam` links from ID istqb files via an explicit allowlist in
   `academy-i18n-check.mjs`, and convert the 7 code spans back into links, keeping the
   "simulator is in English" note.
2. OBS-1: add an "as shipped" note to `docs/QA-ACADEMY.md` §4 (51 lessons; use-case testing
   intentionally absent, consistent with CTFL v4.0).
3. OBS-2: make `certificates.ts` throw on missing `AUTH_SECRET` when `NODE_ENV=production`.
4. OBS-3: add the one-line "Practice record" footer to the normal OG card. (Skip if the owner
   judges the page disclaimer sufficient — it is compliant as-is.)

Not planned (explicitly): re-translating the formal-register vocabulary wholesale (F-LOW-2)
unless the glossary decision goes the other way; building `/id` exam routes (DECISION-1
option a) — out of proportion to the gap; and any change to the exam bank (nothing found).

## 6. What was checked and found healthy — summary table

| Area | Result |
|---|---|
| EN lessons, 51/51 read in full | No correctness defects; cross-references accurate |
| ID lessons (T1–T3 37/37 full pair read; T4–T5 sampled; all 51 machine-scanned) | Faithful, idiomatic, register consistent; defects limited to the §4.2–4.3 lists |
| Internal links EN↔ID | 0 unlocalised links either direction; all targets are real slugs |
| Learning flow, 5 tracks | Order sound; all 50 "Next:" pointers match index order; track handoffs correct |
| TestForge claims | All verified true except F-HIGH-1 (two T3 lessons) |
| Sandbox tie-in | 13/13 sandbox lessons have coach tasks; 11 checkers + 2 documented self-assessed |
| Exam bank | Structure machine-asserted; all sampled answer keys correct; no copyright-proximity concerns |
| Certificates | §7.4 fully satisfied; issuance rules and privacy behaviour as specified |
| Trademark / disclaimers | Enforced by build; EN + ID disclaimers present and non-identical |

---

## Appendix A — the escape scans (for re-running / porting into the i18n check)

Lone-backslash-mid-line scan (finds sub-class A; legit escapes `\\`, `` \` ``, `\$`, `\n`,
`\r`, `\t`, `\u` and quote escapes are excluded when filtering the output):

```js
// scan: walk src/content/academy/{tracks,translations/id}, per line, find
// backslash runs of odd length whose next char is not one of ` $ n r t u
// (then filter out \" and \' which are legit inside quoted strings)
for (let j = 0; j < line.length; j++) {
  if (line[j] !== "\\") continue;
  let k = j; while (k < line.length && line[k] === "\\") k++;
  const runLen = k - j, next = line[k] ?? "";
  if (runLen % 2 === 1 && !"`$nrtu".includes(next)) report(file, i + 1, line);
  j = k - 1;
}
```

Trailing-backslash scan (finds sub-class B — swallowed newlines):

```js
const m = line.match(/(\\+)\s*$/);
if (m && m[1].length % 2 === 1) report(file, i + 1, line);
```

At audit time the combined tally reads:

```
EN: 0 lost escapes (0 mid-line, 0 trailing) on 0 lines in 0 files
ID: 19 lost escapes (8 mid-line, 11 trailing) on 17 lines in 7 files
```

which is exactly the set enumerated in §4.3. After WP-1 both lines must read `0`.
