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
>
> **Status: closed, 2026-08-23.** All four work packages shipped the same day the audit was
> written — see the per-package notes in §5. Every finding is either fixed or, where it was a
> decision, settled by the owner and recorded. Four of them are now build-asserted rather than
> trusted to review: lost escapes (8), terminology (9), the exam-link exception and its caveat
> (10), and the `-mu` register forms. The findings below are kept in the past tense they were
> written in; treat this document as the record of what was found, and §5 as what was done.
>
> **The two residual risks the audit accepted rather than retired were worked off on 2026-08-24
> and are recorded in §7**, which is appended after closure and does not revise anything above it.
> With those two passes done, nothing in this document is still outstanding.

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
**Done 2026-08-23** — all four. DECISION-1 settled as option (b) by the owner; OBS-3 taken rather
than skipped. With this, all four work packages are complete and the audit is closed.
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
| ID lessons (T1–T3 37/37 full pair read; T4–T5 sampled at audit time, **51/51 full pair read as of §7.1**; all 51 machine-scanned) | Faithful, idiomatic, register consistent; defects limited to the §4.2–4.3 lists and the smaller §7.1 list |
| Internal links EN↔ID | 0 unlocalised links either direction; all targets are real slugs |
| Learning flow, 5 tracks | Order sound; all 50 "Next:" pointers match index order; track handoffs correct |
| TestForge claims | All verified true except F-HIGH-1 (two T3 lessons) |
| Sandbox tie-in | 13/13 sandbox lessons have coach tasks; 11 checkers + 2 documented self-assessed |
| Exam bank | Structure machine-asserted; all sampled answer keys correct at audit time, **all 255 re-derived in §7.2** (one wrong key found and fixed); no copyright-proximity concerns |
| Certificates | §7.4 fully satisfied; issuance rules and privacy behaviour as specified |
| Trademark / disclaimers | Enforced by build; EN + ID disclaimers present and non-identical |

---

## 7. Follow-up passes, after closure

The audit closed with every finding fixed or decided, but it named **two residual risks** rather
than retiring them: the Indonesian T4–T5 lessons had been sampled rather than pair-read (§2, Pass 1),
and roughly 240 of the 255 exam answer keys had never been individually re-derived (§4.6). Each
subsection below is the record of one pass at one of them, and **both passes are done**. They are
follow-ups, not a re-audit: nothing in §1–§6 is revised, and anything a pass changes is stated here.

Between them the two passes found ten defects in material the audit had already blessed — nine
small translation slips and one wrong exam answer key — which is roughly what a sampled read
should be expected to leave behind, and the reason the audit named the two risks instead of
declaring them closed.

### 7.1 The Indonesian T4–T5 full pair read — done 2026-08-24

**Coverage.** All 14 T4–T5 lesson pairs read in full, side by side, English against Indonesian —
`beyond` 7/7 and `istqb` 7/7 — plus both track `index.ts` pairs. With §2's T1–T3 read, the
Indonesian tree is now **51/51 pair-read**, and the follow-up §2 asked for is closed.

**Verdict: the estimate in §2 was pessimistic.** It expected "one or two more" §4.2-class
meaning-shift slips in T4–T5. None of that severity was found: no lesson misstates a technical
claim, no worked example computes differently from its English original, every internal link is
localised, and the exam-critical ISTQB arithmetic (three-point estimate, the 8/6/4/11/9/2 blueprint
table, statement-versus-branch, the BVA variants) is correct in every chapter. What the read did
find is nine smaller defects, two of which shift a reading and seven of which are consistency or
legibility:

| # | File | Read as | Now reads |
|---|---|---|---|
| 1 | `id/istqb/ch6-test-tools.ts` | "usaha perawatan **rutin** diremehkan" — parses as *routine maintenance* effort | "usaha perawatan**nya** rutin diremehkan" (EN: maintenance effort is *routinely* underestimated) |
| 2 | `id/istqb/exam-strategy.ts` | K3 questions demand "**penurunan nilai**" — reads as *a drop in marks* | "menuntut Anda **menurunkan nilai**, menghitung aturan…" (EN: deriving values) |
| 3 | `id/beyond/testing-in-production.ts` | "kemenangan **ketereujian**" — a typo | "**keterujian**", the form `ch3-static-testing` already uses |
| 4 | `id/beyond/performance-testing.ts` | "Endpoint login jarang menjadi **lehernya**" | "**leher botolnya**" — the form ch1 uses twice for *bottleneck* |
| 5 | same | "pengguna yang mendarat di sana **tidak proporsional adalah** mereka…" | "**secara tidak proporsional** adalah mereka…" |
| 6 | `id/istqb/ch4-test-analysis-design.ts` | the state table's states were *Keluar* / *Masuk*, colliding with its own event *keluar* in the same table | *Sudah keluar* / *Sudah masuk* — the states are now distinguishable from the event in the K3 chapter's worked example |
| 7 | `id/beyond/portfolio.ts` (×2) | "**lingkungan**" for a bug report's environment field | "**environment**" — see the glossary row below |
| 8 | `id/fundamentals/bug-reports.ts` (×4) | the same split *inside one file*: "environment (staging/prod)" in the prose, "**Lingkungan:**" as the worked report's field label | "**Environment**" throughout |
| 9 | `id/istqb/exam-strategy.ts` | "**ketiga puluh dua** sisanya rata-rata 75 detik" — reads as an ordinal | "**tiga puluh dua** sisanya…" |

**One glossary decision came out of it.** Finding 8 is exactly what `docs/ACADEMY-ID-GLOSSARY.md`
§4 says earns a row — a term translated two ways in the tree, here two ways in one file — so
*environment* is now a row, the retired *lingkungan* is assertion (9) of `academy-i18n-check.mjs`,
and the sweep shipped in the same PR. The regex carries the tree's one legitimate exception:
ISTQB ch1's **kondisi lingkungan** (radiation, interference, pollution) is the physical world, not
a test environment, and stays Indonesian.

**A second mechanical scan was run and found nothing** — worth recording so it is not repeated
blind. Every meaning-shift the original audit found had changed a *count* (`keenamnya` for three
partitions), so a scan compared the multiset of numeric tokens in each English lesson against its
Indonesian counterpart across all 51 pairs (Appendix B). After excluding comments and the
`minutes:` field, four files differ, and all four are the translator spelling a number out or
repeating one: *4pm* → "pukul empat sore", *6pm* → "pukul enam sore", one extra "404" in a
rephrased clause, one extra "60%". **Zero numeric meaning shifts in the tree.**

**Not changed, recorded instead:** *manusiawi* for English *human* (`ai-in-qa` ×2,
`what-to-automate`, `ch3-static-testing`) sits closer to "humane" than to "human", but it is the
tree's consistent rendering in all four places, and consistency is the glossary's own governing
principle. Revisit it as a voice decision or not at all.

### 7.2 Every exam answer key re-derived — done 2026-08-24

**Coverage.** All **255 questions** in `src/content/academy/questions/**` read and re-derived by
hand: stem, every choice, the key, and the explanation, against the CTFL v4.0 learning objective
each one carries. §4.6's residual — "~240 of 255 answer keys were not individually re-derived" — is
closed. Method note: the questions were rendered into a compact form first (id, K-level,
`syllabusRef`, stem, choices with the key marked, explanation), and the renderer was checked
against the source files by count — 255 questions, 1056 choices, 307 `correct` flags, no missing
stems — so a silently dropped question or key could not pass as a clean read.

**Result: 254 of 255 keys are correct.** Every computational question re-computes to its key —
the BVA variants, the partition and decision-table counts (including the 2ⁿ and the collapsed
tables), 0-switch and 1-switch coverage, statement and branch percentages, the three-point
estimate, the risk-level products, defect detection percentage. The sampled verdict in §4.6 holds
across the whole bank.

**The one wrong key: `ch1-q11`.** The stem describes writing *"verify that an expired discount code
is rejected at checkout"* **before** choosing values or steps — that is a test condition, so the
activity is **test analysis**. The question keyed **test design**, and did not offer test analysis
at all; its explanation compounded the error by placing "turning it into a concrete case with input
values, steps, and expected results" in *test implementation*, which is test design's job. The
bank contradicted itself here — `ch1-q23` asks the analysis-versus-design distinction directly and
keys it correctly — and it contradicted its own chapter lesson, which uses this very example
("deciding *that* the discount rule needs testing is analysis"). Fixed: the choices are now
design / **analysis** / implementation / execution, and the explanation walks the four activities
in order.

**One wrong explanation behind a correct key: `ch2-q11`.** The key (an OS upgrade on the production
servers is a maintenance-testing trigger) is right; the explanation filed it under **migration**,
where the syllabus and the track's own lesson table put changes to the operational environment
under **modification**. Rewritten, and `ch2-q30`'s looser phrasing of the same list tightened with
it.

**What this does not retire.** The bank cannot be machine-checked for correctness — `bank-check`
asserts structure, not truth — so the risk returns with every question added after this date. The
§4.6 recommendation stands for new material: read the new questions against their objective before
they ship, and prefer adding them in small batches for that reason.

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

---

## Appendix B — the numeric-token scan (§7.1)

Every meaning-shift slip §4.2 found had changed a number, so a count comparison is a cheap way to
re-check all 51 pairs mechanically. It is a **review aid, not a build assertion**: the hits it
produces need a human, because Indonesian legitimately spells small numbers out.

```js
// walk src/content/academy/tracks/<track>/*.ts and the id/ file of the same
// name; strip /* */ comments and the `minutes:` line (the translation has no
// such field, and a stray `*` filter would also eat markdown **bold** lines —
// that mistake produced 14 false-positive files before it was caught), then:
const nums = (src) => {
  const out = new Map();
  for (const m of clean(src).matchAll(/\d+(?:[.,]\d+)?/g)) {
    const k = m[0].replace(",", ".");        // 1,2 detik === 1.2 seconds
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
};
// report every token whose EN count differs from its ID count, with the lines
```

At the time of §7.1 the scan reports four files, all benign:

```
manual-pro/reporting-to-stakeholders.ts   6:  EN 1 / ID 0   ("6pm" → "pukul enam sore")
automation/api-automation.ts            404:  EN 7 / ID 8   ("one 404 at a time" → "satu 404 demi satu 404")
beyond/ai-in-qa.ts                        4:  EN 2 / ID 1   ("4pm" → "pukul empat sore")
istqb/exam-strategy.ts                   60:  EN 3 / ID 4   ("60%" repeated in a split sentence)
```
