# TestForge QA Academy — Indonesian glossary

> **Decided:** 2026-08-23 (owner) · **Scope:** `src/content/academy/translations/id/**` — all 51
> lesson translations, the five track `index.ts` files, and any slice added after this date.
> **Enforced by:** assertion (9) of `scripts/academy-i18n-check.mjs`, which runs in `prebuild`.
>
> This document exists so the next translation slice stops re-deciding what the last one decided.
> Written after the 2026-08-23 content audit (`docs/AUDIT-ACADEMY.md` §4.2) found the same concept
> translated three different ways across the tree — **not** because any of the losing spellings was
> bad Indonesian. They were all fine. That is exactly the problem: a reviewer reads one lesson and
> sees nothing wrong, and the split only exists when you read fifty-one.

---

## 1. The standing rule

**Common English QA and developer terms stay in English.** Indonesian practitioners say *test case*,
*locator*, *pipeline*, *pull request*, *environment*, *smoke test*. Translating those into calques
makes the material read like a textbook nobody works from, and — worse for a course — leaves the
reader unable to recognise the word when they meet it in a tool, a job ad, or the ISTQB exam.

Everything below is either an application of that rule or a deliberate exception to it.

## 2. Decisions

### 2.1 One canonical form (the retired spellings are build-enforced)

| Concept | Use | Retired | Why |
|---|---|---|---|
| bug report | **laporan bug** | ~~laporan cacat~~, ~~catatan cacat~~ | Matches the kept-English rule and everyday Indonesian QA speech. The `bug-reports` lesson was already titled this way while the lesson pointing *at* it said "laporan cacat". |
| bug report, ISTQB track | **defect report** (English) | ~~laporan cacat~~ | Syllabus term. The exam says *defect report*, and the ISTQB track already keeps *Defect management*, *Test execution*, *coverage item* in English. Repeat mentions may use *laporan bug*. |
| stakeholder | **stakeholder** | ~~pemangku kepentingan~~ | The English term was already dominant outside the ISTQB track (10 vs 6); *pemangku kepentingan* is government-register Indonesian. |
| hook | **hook** | ~~kait~~ | One stray calque in `contract-testing`'s provider states, against five English uses elsewhere. |
| checklist | **checklist** | ~~daftar periksa~~ | One stray in `test-levels`, against ten English uses. |
| sanity check | **sanity check** | ~~pemeriksaan penyehat~~ | An awkward coinage — *penyehat* means "one who makes healthy". Nobody says this. |
| environment (the test environment) | **environment** | ~~lingkungan~~ | Already the tree's dominant form (79 uses). `bug-reports` used both *inside one file* — "environment (staging/prod)" in its prose, "Lingkungan:" as the field label of the worked report — and it is a field name the reader will meet in TestForge and in every tracker. **Exception:** ISTQB ch1's *kondisi lingkungan* (radiation, interference, pollution) is the physical world, not a test environment; the check's regex excludes that phrase. |
| test management tool | **tool test management** | ~~alat manajemen pengujian~~, ~~sistem manajemen pengujian~~ | The category name of the product the whole Academy is taught inside. Owner's correction, 2026-08-28: *"jika itu sebuah penyebutan umum tidak perlu di-translate."* Also fixed in `chrome.ts`, where it was the first line of the roadmap hero and of the meta description. |
| run (a test run, a CI run) | **run** | ~~pelaksanaan~~ | The split that best shows why this rule exists: 87 English against 84 calqued, and `automation` alone carried 56 of them while `fundamentals` and `istqb` carried none. **Run** is a button in TestForge; a learner taught *pelaksanaan* cannot connect the two. *pelaksanaan ulang* → **rerun**. |
| form | **form** | ~~formulir~~ | 49 against 2. |
| output | **output** | ~~keluaran~~ | 32 against 4. Includes the ISTQB work-product sense — the syllabus register does not buy back a word the reader meets in every console. |
| link | **link** | ~~tautan~~ | 16 against 7, and *tautan cacat* was a calque of a calque — TestForge shows **defect links**. |
| input | **input** | ~~masukan~~ | 51 English against 4. `cross-browser-mobile` wrote "Setiap input menerima masukan" — both spellings inside one clause. |
| scanner | **scanner** | ~~pemindai~~ | 20 uses, no English competitor — the whole security lesson was calqued away from the word its tools are sold under. |
| attachment | **attachment** | ~~lampiran~~ | A TestForge UI label. |
| assignee | **assignee** | ~~penerima tugas~~ | A TestForge UI label. |
| picker (date, colour, locator) | **picker** | ~~pemilih~~ | Widget nouns only. **Not** *pemilihan* (selection, choice), which is ordinary Indonesian and stays. |
| clipboard | **clipboard** | ~~papan klip~~ | |

> **The product's own name is not translated either.** The landing nav said *Akademi* and the footer
> *Akademi QA* while the page they linked to branded itself **QA Academy**. Fixed in `src/lib/i18n.ts`.
> This one is not in `RETIRED_TERMS` because it lives outside `translations/id`.

### 2.2 English, with an Indonesian gloss allowed after first use

Introduce in English so the reader can recognise the term elsewhere; use the Indonesian afterwards
if the sentence reads better for it.

| Concept | First use | Afterwards |
|---|---|---|
| boundary value | **boundary value** | *nilai batas* |
| decision table | **decision table** | *tabel keputusan* — the existing `(tabel keputusan)` gloss in `decision-tables` is the pattern to copy |

### 2.3 Indonesian, with named English terms kept intact

| Concept | Use | But keep English in |
|---|---|---|
| assertion | **asersi** | the named Playwright APIs — *web-first assertion*, *soft assertion* |
| coverage | **cakupan** | named metrics — *statement/branch/path/unit coverage*, ISTQB's *coverage item*. Inside a passage built on those metrics, stay English throughout rather than alternating |
| branch | *cabang* / *bercabang* for control flow | **branch** for git |

### 2.4 Formal register — kept as is

`berkas` (file), `basis data` (database), `unggah` / `unduh` (upload / download).

These sit at the formal end of Indonesian tech writing, where practitioner speech is mostly
*file* / *database* / *upload*. The owner's decision (2026-08-23) is to **keep them**: they are
already consistent across all 51 lessons, the audit rates the choice a matter of style rather than a
defect, and switching would be a ~110-occurrence sweep that shifts the Academy's whole voice for no
correctness gain. Revisit only as a deliberate voice change, never one lesson at a time.

## 3. Register (decided 2026-08-18, restated here)

- **Anda**, always capitalised — it is a proper pronoun, not a lowercase `you`.
- Never **kamu**, and never its clitic family: *dirimu*, *milikmu*, *bagimu*, *padamu*, *kepadamu*,
  *denganmu*, *untukmu*, *kau*. Write *diri Anda*, *milik Anda*, *kepada Anda*. The `-mu` forms
  outlived the original `kamu` rule by a year — `contract-testing` carried *tempatkan dirimu* until
  the 2026-08-23 sweep — so they are now asserted separately.
- **Code samples stay in English.** Identifiers, test names, string literals, config keys. Learners
  will meet English tooling; a translated `test("...")` teaches them the wrong thing to type.
  Comments *inside* code blocks are translated.
- **Links stay inside Indonesian**: `/id/academy/…`, never `/academy/…`. Slugs themselves stay
  English, so the URL of a translated lesson differs from the English one only in its `/id` prefix.

## 4. Adding to this glossary

A term earns a row here when it has actually been translated two ways in the tree — not when someone
anticipates that it might be. Add the row, add the retired spelling to `RETIRED_TERMS` in
`scripts/academy-i18n-check.mjs`, and sweep the tree in the same PR, so the rule and the content
never disagree. A rule with exceptions still in the tree is a rule the next author will ignore.
