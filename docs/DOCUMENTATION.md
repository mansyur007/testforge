# TestForge — Consolidated Project Documentation

> **Purpose.** This is the single reference document for TestForge: what was audited, what was
> specified, what was compared against the competition, and — feature by feature — **what was
> built**. It replaces four separate documents that previously lived at the repository root and
> in `docs/`. Nothing was summarised away: every section below is the full text of its source
> document, with only the heading levels adjusted and the Indonesian-language part translated
> into English.
>
> Consolidated: 2026-07-19.

---

## Statement of completion

**Every feature specified for TestForge has been implemented and merged into `main`.**

| Backlog track | Range | Count | Status |
|---|---|---:|---|
| P1 — foundations expected by TestRail/Qase users | F-01 … F-10 | 10 | ✅ all shipped |
| P2 — competitive differentiators | F-11 … F-24 | 14 | ✅ all shipped |
| P3 — nice-to-have / niche segments | F-25 … F-37 | 13 | ✅ all shipped |
| Leapfrog — features no competitor has | L-01 … L-05 | 5 | ✅ all shipped |
| Post-backlog additions | F-38 (+ Part B) … F-43 | 6 | ✅ shipped |
| **Total** | | **48** | **✅ 48 / 48 complete** |

Each work order in [Part IV](#part-iv--feature-work-orders) carries a `[x]` marker and, in most
cases, its completion date and any deliberately deferred sub-scope. Deliberate exclusions are
recorded in place rather than silently dropped — the notable ones being SAML and SCIM (out of
scope in favour of OIDC in F-20), Allure result parsing (F-11), dashboard PDF export
(superseded by share links and browser print in F-17/F-35), and the attachment uploader in the
comment composer (F-16, needs a two-phase draft-id flow).

Two operational guides remain as separate documents because they are living how-to references
for users rather than a record of work completed:

- [`docs/SELF-HOSTED-MIGRATION.md`](SELF-HOSTED-MIGRATION.md) — whole-instance backup & restore.
- [`docs/CASES-AS-CODE.md`](CASES-AS-CODE.md) — the L-03 GitOps two-way sync workflow.

---

## What was merged into this document

| Part | Source document | Original size | What it is |
|---|---|---:|---|
| [Part I](#part-i--application-audit--user-flows) | `APP-AUDIT.md` | 135 lines | Application audit and end-to-end user flows, snapshot of `main` dated 2026-06-14, taken after the migration to OAuth-only authentication. |
| [Part II](#part-ii--prd-audit) | `AUDIT-PRD.md` | 100 lines | Audit of `TestForge_PRD_v1.0.docx` — missing features, internal inconsistencies, scope risks, and what the MVP actually delivered against it. |
| [Part III](#part-iii--competitive-comparison) | `docs/FEATURE-COMPARISON.md` | 434 lines | Feature-by-feature comparison against TestRail, Qase, TestLink and Test IO, and the gap analysis that generated the backlog. **Translated from Indonesian.** |
| [Part IV](#part-iv--feature-work-orders) | `docs/TODO-FEATURES.md` | 2802 lines | The executable backlog: full implementation work orders for all 42 features, plus repo conventions and the design system appendix. |

### How to read it

The four parts are deliberately in chronological-causal order: the audits (I, II) found the
gaps, the competitive comparison (III) prioritised them into a roadmap, and the work orders
(IV) specified and delivered them. Parts I–III are **historical snapshots** — they describe the
codebase as it stood when each was written, so statements there of the form "TestForge does not
yet have X" should be read against Part IV, which records X being built. Part IV's §0 (repo
conventions) and §7 (design system appendix) are the only sections still **normative for new
work**.

---

## Part I — Application Audit & User Flows

*Source document: `APP-AUDIT.md`. Reproduced verbatim; original title: "TestForge — Application Audit & User Flows".*

> Compiled 2026-06-14. Snapshot of `main` after migration to **OAuth-only auth**.
> For relaxed review — not for execution. Sections marked ⚠️ = items you should decide on/review.

---

### 1. Summary

TestForge = open-source **Test Case Management** platform (TestRail/Zephyr alternative).
- **Stack:** Next.js 14 (App Router) · React 18 · Prisma + SQLite (portable to Postgres) · Tailwind · JWT session (jose) · TypeScript.
- **Deploy:** Docker Compose on VPS `103.169.207.239`, fronted by Tokopudidi's Caddy stack, domain `testforge.emha.space`. Auto-deploy via GitHub Actions on push to `main`.
- **UI language:** bilingual (EN/ID) via `src/lib/i18n.ts` + cookie `tf_lang`.
- **Build status:** `tsc` ✅ · `next build` ✅ · OAuth route live & verified (307 → provider).

---

### 2. Authentication & Access Control

#### Login/Signup — OAuth only (Google + GitHub)
- Single route handles initiate + callback: `src/app/api/auth/oauth/[provider]/route.ts`.
- Flow: button → redirect to provider (set CSRF `state` cookie, httpOnly) → callback validates `state` → exchange `code`→token → fetch profile/email → create user (`emailVerifiedAt` set immediately) → create session → redirect `/onboarding` (new user) or `/dashboard`.
- GitHub: fallback to fetch primary verified email when profile hides email.
- Session: JWT in `tf_session` cookie, httpOnly, 1 day (default) / 30 days. Set `rememberMe=true` for OAuth.

#### Role / RBAC
- **Global user role:** `ADMIN | MEMBER | VIEWER`. **First user in DB becomes ADMIN automatically** (`userCount === 0`).
- **Per-project role (`ProjectMember`):** `OWNER | ADMIN | MEMBER | VIEWER`. Project creator becomes `OWNER`.
- **Enforcement:** `VIEWER` denied write access (create project/case/run). `requireSession()` guard in `(app)/layout.tsx` protects the entire app area (no `middleware.ts`; protection per layout/page).

#### API for CI/CD
- API Key (Bearer) — stored as SHA-256 hash, only 8-char prefix displayed.
- `POST /api/v1/junit` — **requires** API key auth.
- `GET/POST /api/v1/projects/[slug]/cases` — accepts **session OR** API key.

⚠️ **Items for you to review (auth):**
1. **No password fallback.** If 4 OAuth env vars are wrong/expired → nobody can log in. No "break-glass" admin.
2. **First-login-becomes-admin.** On empty prod DB, whoever logs in first = ADMIN. Make sure you are first (already noted).
3. **Legacy admin seed** (`admin@testforge.local` + password) can no longer log in — demo data is orphaned.

---

### 3. Feature Inventory

| Area | Route | Function | Write denied for VIEWER |
|---|---|---|---|
| **Landing** | `/` | Marketing: features, comparison, demo, integrations, testimonials, FAQ. Bilingual. | — |
| **Auth** | `/login`, `/signup`, `/register`→`/signup` | OAuth Google/GitHub. | — |
| **Onboarding** | `/onboarding` | 3-step wizard: create first project (blank/web/mobile/api template) → invite team → integration interests. | — |
| **Dashboard** | `/dashboard` | Cross-project summary. | — |
| **Projects** | `/projects`, `/projects/[slug]` | List + create project; suite/case tab, milestone. | ✅ |
| **Test Case** | `.../cases/new`, `.../cases/[id]`, `.../[id]/edit` | Case CRUD: title, steps (JSON action/expected), preconditions, priority, type, status, automationStatus, tags, assignee, linked issues. Clone, soft-delete, **bulk edit**. | ✅ |
| **Suite/Section** | within `/projects/[slug]` | Recursive hierarchy (suite → section via `parentId`). | ✅ |
| **Test Run** | `.../runs`, `.../runs/new`, `.../runs/[id]` | Create run (select cases), execute results (PASSED/FAILED/BLOCKED/SKIPPED/etc + comment, time, defect URL), complete run, **rerun failed**. | ✅ |
| **Reports** | `.../reports` | Run result statistics per project. | — |
| **Import** | `.../import`, `POST /api/import/cases` | Import test cases from **CSV** (papaparse). Template available. | ✅ |
| **Export** | `/api/export/cases`, `/api/export/run` | Export cases & run results. | — |
| **API Keys** | `/settings/api-keys` | Create/delete API key for CI/CD. | — |
| **Audit Log** | `/settings/audit-log` | Action history (login, CRUD, etc.). | — |
| **CI/CD API** | `/api/v1/junit`, `/api/v1/projects/[slug]/cases` | Ingest JUnit XML results; read/write cases via API. | via API key |
| **Docs** | `/docs/self-hosting` | Self-host guide (env, Docker, VPS). | — |
| **Legal** | `/terms`, `/privacy` | Static pages. | — |

---

### 4. User Flows (end-to-end)

**A. New user onboarding**
`/login` → click Continue with Google/GitHub → provider consent → callback → user created (verified) → session → `/onboarding` → create first project (select template → suite auto-created) → invite team (optional) → select integration interests → `completeOnboarding` sets `onboardedAt` → `/dashboard`.

**B. Create & run tests**
`/projects` → create project (become OWNER) → create suite/section → add test case (steps, priority, assignee…) → `/runs/new` select cases → create run → execute: mark each result + comment/defect → complete run → view `/reports`. Can **rerun failed** for follow-up run.

**C. CI/CD integration**
`/settings/api-keys` create key → in pipeline send `POST /api/v1/junit` (header `Authorization: Bearer <key>`) with JUnit XML → results appear as automatic run (`source=JUNIT`).

**D. Bulk import**
`/projects/[slug]/import` → download CSV template → upload → preview → commit to project.

**E. Logout** — "Sign out" button in sidebar → `clearSession` → `/login`.

---

### 5. Data Model (13 entities)

`User` · `Organization` · `Project` · `ProjectMember` · `Milestone` · `TestSuite` (recursive) · `TestCase` · `TestRun` · `TestRunResult` · `ApiKey` · `Invitation` · `VerificationToken` · `AuditLog`.

Important notes:
- `TestCase.seq` + `Project.caseCounter` → human-readable ID `TC-[SLUG]-[seq]`.
- `TestCase.deletedAt` → soft delete (queries always filter `deletedAt: null`).
- `User.organizationId` **nullable** → app runs without org.
- Cascade delete configured cleanly (delete project → suite/case/run/result deleted too).

---

### 6. ⚠️ Findings & Gaps for Review

**Leftover from OAuth migration (cleanup, not bugs):**
1. **`VerificationToken`** still in schema but no longer used (verification/reset flow removed). Can drop on next DB migration.
2. **`User.passwordHash`** still `NOT NULL`; OAuth fills it with random bytes. Safe, but column is misleading. Consider making it nullable.
3. **i18n** still holds many dead strings (email/password form, verifyEmail, forgotPassword). Harmless, just dusty.

**Incomplete flows (existed before this session):**
4. **Team invite = dead end.** `onboardingInvite` creates `Invitation` record but **no email is sent** (no SMTP) **and there is no accept-invite page**. Invited people have no way in except OAuth login themselves (then become user without org). → "Invite team" feature is cosmetic for now.
5. **Org never created for OAuth users.** Onboarding creates a *project*, not an *organization*. So `organizationId` is always null for OAuth users. Doesn't crash (org optional), but org-based features (invites) don't work.
6. **Soft-delete without recycle bin.** Cases get `deletedAt` but no restore/trash UI. Deleted = gone from UI forever.

**Operational / security:**
7. **No break-glass login** (see §2). Lockout risk if OAuth breaks.
8. **OAuth client secret in chat history** from this session → consider rotating.
9. **Rate-limit lockout** existed for password login; no longer relevant (OAuth). No OAuth-specific rate limit besides `state` protection.
10. **`AUTH_SECRET`** has dev default (`testforge-dev-secret`) in `lib/auth.ts` — ensure prod env truly overrides (already set on VPS ✅).

**What's already good:**
- ✅ CSRF `state` on OAuth, httpOnly/secure cookies.
- ✅ API key stored as hash, not plaintext.
- ✅ `requireSession` guard consistent across `(app)` area.
- ✅ Cascade delete & unique constraints clean.
- ✅ Audit log for important actions.
- ✅ Soft-delete filtered consistently in all queries/endpoints.

---

### 7. Priority Suggestions (if continuing)

| Priority | Item | Reason |
|---|---|---|
| 🔴 High | Decide **org + team invite** strategy (§6.4–6.5) or hide invite step in onboarding | Feature is misleading today |
| 🟡 Medium | **Break-glass / guarantee at least 1 admin** | Avoid total lockout |
| 🟡 Medium | DB migration: drop `VerificationToken`, `passwordHash` nullable | Post-OAuth cleanup |
| 🟢 Low | Recycle bin for cases | Prevent data loss |
| 🟢 Low | Clean up dead i18n strings | Maintenance |

---
*End of audit. Enjoy lowering your cortisol — everything is committed & deployed, nothing hanging.* 🌿
## Part II — PRD Audit

*Source document: `AUDIT-PRD.md`. Reproduced verbatim; original title: "TestForge PRD v1.0 Audit".*

Audit results for `TestForge_PRD_v1.0.docx` (June 2025). Overall this PRD is
**mature and above average**: competitor analysis, personas, user stories
with acceptance criteria, measurable NFRs, data model, and open source strategy.
However, the following **functional gaps, internal inconsistencies, and scope
risks** were found.

### 1. MISSING Features (needed but not in the PRD)

| # | Gap | Impact | Status in this MVP |
|---|-----|--------|-------------------|
| 1 | **Forgot password / reset password** — not mentioned at all even though email+password auth is P0 | Critical: user permanently locked out on self-hosted without DB admin | Not yet (needs SMTP) — backlog v0.2 |
| 2 | **Comments / discussion on test cases** — §4.5.1 mentions "latest comments" in activity feed, but comment feature not specified anywhere | Collaboration (main product goal) is incomplete | Partial: comment per execution result exists |
| 3 | **Rerun failed tests only** — standard TestRail/Qase feature to create new run from failed cases | Very common regression workflow | ✅ Implemented |
| 4 | **Shared/reusable steps** — common steps (e.g. login) must be copied to hundreds of cases | Expensive test case maintenance | Not yet — backlog |
| 5 | **Review/approval workflow** — `Draft` status exists, but no definition of who/how Draft → Active | Test case quality gate unclear | Not yet — backlog |
| 6 | **Recycle bin / restore** — version history exists, but no spec for recovering deleted cases | Accidental data loss | ✅ Soft delete (`deletedAt`) prepared |
| 7 | **Onboarding / sample data** — no first-run experience spec | Open source adoption heavily depends on first 5 minutes | ✅ Demo project seed |
| 8 | **Test run comparison** — compare two runs (before vs after fix) | Regression analysis | Not yet — backlog |
| 9 | **Estimated duration per case** — actual timer exists (§4.3.3), but without estimate field can't plan run capacity | QA Lead can't estimate run deadline | Not yet — backlog |
| 10 | **Backup/restore & full data export** — important for self-hosted, not mentioned | User data loss risk | Partial: CSV export per entity |
| 11 | **Email service (SMTP)** — US-005 requires email notifications, but SMTP not in tech stack §5.1 or deployment §5.4 | US-005 acceptance criteria can't be met | Not yet — backlog |
| 12 | **Telemetry privacy policy** — §11 relies on "opt-in telemetry" but feature not specified | Open source community trust | Not yet — backlog |

### 2. Internal PRD Inconsistencies

| # | Finding | Location |
|---|--------|--------|
| 1 | **`milestones` entity missing from ERD** even though used in §4.3.1 ("set milestone for test run") and §9 (`test_runs.milestone_id`) | §9 vs §4.3.1 — ✅ fixed in schema |
| 2 | **`api_keys` table not in ERD** even though §5.3 requires API key for CI/CD and §5.5 requires hashing | §9 vs §5.3/§5.5 — ✅ fixed |
| 3 | **`audit_logs` table not in ERD** even though §5.5 and §8 require audit log with 90-day retention | §9 vs §5.5 — ✅ fixed |
| 4 | **Version history (§4.2.2) has no table** `test_case_versions` in ERD | §9 vs §4.2.2 — backlog |
| 5 | **Requirement traceability matrix (§4.5.3)** needs `requirements` entity, not in ERD | §9 vs §4.5.3 — backlog (v0.3 per roadmap) |
| 6 | **Custom fields**: §4.2.1 says "configurable per project" but no custom field definition table (only `custom_fields_json` on test_cases) | §9 — backlog v0.2 |
| 7 | **`In Progress` status §4.3.2** trigger is "automatic when started" but "started" not defined (open page? click start button?) | §4.3.2 — in this MVP: manual |
| 8 | **MVP §7.1 mentions "Export PDF" P1** but tech stack doesn't include PDF generation library | §7.1 vs §5.1 — this MVP uses CSV first |

### 3. Scope Risks & Recommendations

1. **3-month MVP scope too ambitious** — full CRUD REST API + JUnit upload +
   CSV import/export + RBAC + Docker in 3 months is realistic only for team ≥3
   full-time engineers. Recommendation: trim public REST API to CI-needed endpoints
   only (as in this MVP).
2. **GraphQL (§5.2) should be removed from initial spec** — dual API (REST+GraphQL)
   doubles maintenance; no user story requires it.
3. **10 automation frameworks in §4.4.1 not realistic for launch** — framework-agnostic JUnit XML
   (as in this MVP) already covers Cypress, Playwright,
   Jest, Pytest, Mocha, Selenium at once. Native plugins enough for 2 (Cypress,
   Playwright) in v0.2 per roadmap.
4. **WebSocket realtime (§5.1) not needed in MVP** — polling/refresh enough;
   add when there's evidence of simultaneous collaboration need.
5. **No conflict editing definition** — two users editing same test case
   will overwrite each other. Need strategy (optimistic locking / aware last-write-wins)
   before realtime collaboration features.

### 4. Additional Audit: Section 11 (Homepage) & 12 (Register/Sign Up)

Audit for PRD revision adding homepage and auth specs
(`TestForge_PRD_v1.0 (1).docx`). Both sections are detailed and actionable
(ready-to-use copywriting, prioritized FRs). Findings:

#### 4.1 New inconsistencies & gaps

| # | Finding | Impact |
|---|--------|--------|
| 1 | **ERD §9 not updated**: §12.2 needs `organizations` entity (unique slug per workspace), §12.3/12.5 need `verification_tokens`, §12.4 needs `invitations` — none in ERD | ✅ All three added to schema |
| 2 | **SMTP still not in tech stack §5.1** — now a hard blocker: AU-001 requires email verification before login, §12.5 details verification email, §12.4 needs invite email | Implemented with dev-mode fallback (link shown in UI/log when `SMTP_URL` empty) |
| 3 | **AU-010 (JWT 15 min + refresh token rotation)** conflicts with §12.6.1 "Remember me = 30 days" without explaining non-remember session duration; rotation needs refresh_tokens table also missing from ERD | MVP: JWT cookie 1 day / 30 days (remember me); rotation in backlog |
| 4 | **CAPTCHA (§12.6.2)** mentions hCaptcha/reCAPTCHA — external service not in tech stack, and reCAPTCHA v3 doesn't have "display after 5 failures" (that's v2 behavior) | Backlog; 5x/5 min lockout already works |
| 5 | **Testimonials (§11.2 #8)** require early user quotes — product not launched, no users yet | Filled with placeholder labeled "Early Adopter/Beta Tester"; replace with real testimonials before launch |
| 6 | **Social proof (§11.2 #2)** shows user/install count — data doesn't exist; fake numbers hurt credibility | Replaced with factual metrics (Docker setup, framework count) |
| 7 | **HP-005 GitHub stars** needs public repo that doesn't exist yet | Implemented fetch + 1 hour cache with "—" fallback if repo not found |
| 8 | **Login lockout**: §12.6.2 requires per-IP **and** per-email; old §8 only per-account | Per-email implemented; per-IP needs trust proxy header, deployment backlog |
| 9 | **§12.1 GitLab OAuth (P1), SAML (P2), Magic Link (P2)** | Per roadmap priority: not in MVP; OAuth route architecture already generic for adding providers |
| 10 | **Onboarding Step 3 (§12.4)** mentions "click to connect" Jira/Slack — integrations only on v0.2 roadmap, so real "connect" impossible at MVP | Implemented as interest recording, not real connection |

#### 4.2 Functional requirements status

**Homepage (HP)**: HP-001 (static+SSR, lightweight) ✅ · HP-002 ✅ · HP-003 ✅
(/docs/self-hosting) · HP-004 ✅ · HP-005 ✅ (fallback) · HP-006 partial
(demo section + live demo link; video tour not yet) · HP-007 ✅ (dark mode via
prefers-color-scheme) · HP-008 ✅ (meta, OG, sitemap, robots) · HP-009 backlog
(analytics) · HP-010 ✅ (server component, works without JS).

**Auth (AU)**: AU-001 ✅ · AU-002/003 ✅ (OAuth route ready; active when env
client ID/secret set) · AU-004 ✅ · AU-005 ✅ · AU-006 ✅ · AU-007 ✅ ·
AU-008 ✅ · AU-009 ✅ (per email) · AU-010 partial (see 4.1 #3) · AU-011
backlog (needs refresh token store) · AU-012 partial (labels + built-in keyboard nav
; full ARIA audit not yet).

### 5. Implemented in this MVP

All **P0** §7.1 items: projects (create/archive), full test case CRUD with all standard fields,
suite+section hierarchy, manual test run with execution + keyboard
shortcuts (US-002), basic auth + RBAC, REST API + API key. Plus **P1** items:
CSV import with preview/validation (US-004), CSV export, framework-agnostic JUnit XML upload
with auto-matching (US-010), run reports + flaky test +
bug correlation + automation coverage, and audit gap fixes #3, #6, #7
plus inconsistencies #1–#3.
## Part III — Competitive Comparison

*Source document: `docs/FEATURE-COMPARISON.md`. Translated from Indonesian; original title: "TestForge vs Kompetitor — Perbandingan Fitur & Roadmap TODO".*

> Created: 2026-07-08. The comparison is based on competitors' public feature sets (each
> vendor's own documentation/marketing, as of roughly early 2026 — pricing and details may
> change) and on the actual state of the TestForge code on the branch at the time of writing.
>
> The final part of this document ([§7 Gap Analysis → TODO](#7-gap-analysis--todo-features)) is
> the list of features TestForge **did not have** yet, prioritised as a roadmap.

### Table of contents (comparison)

1. [Where each product sits](#1-where-each-product-sits)
2. [Comparison table at a glance](#2-comparison-table-at-a-glance)
3. [Detailed comparison per feature area](#3-detailed-comparison-per-feature-area)
4. [Detailed profile per product](#4-detailed-profile-per-product)
5. [Other tools worth watching](#5-other-tools-worth-watching)
6. [TestForge's strengths at the time of writing](#6-testforges-strengths-at-the-time-of-writing)
7. [Gap Analysis → TODO features](#7-gap-analysis--todo-features)

---

### 1. Where each product sits

| Product | Category | Model | Positioning notes |
|---|---|---|---|
| **TestForge** | Test case management (TCM) | Open source, self-hosted (Docker) + hosted `testforge.emha.space` | Free alternative to TestRail/Qase; Next.js + Prisma; SQLite in dev / PostgreSQL in prod |
| **TestRail** (Gurock/Idera) | TCM | Commercial SaaS + server (Enterprise) | De-facto market leader; the most mature option for large manual QA teams |
| **Qase** | Modern TCM + TestOps | Commercial SaaS, has a free tier | Modern TestRail challenger; strong on automation reporting & AI |
| **TestLink** | TCM | Open source (GPL, PHP) | Older generation; strong on requirement traceability, but UI and development have stagnated |
| **Test IO** (EPAM) | **Not a TCM** — crowdtesting service | Commercial, pay per test cycle | Rents out a crowd of human testers + real devices; complements a TCM, does not replace one |
| Zephyr Scale, Xray | TCM inside Jira | Commercial (Atlassian Marketplace) | The default choice for teams that live in Jira |
| Testmo, Testiny, PractiTest, qTest, Allure TestOps, Kiwi TCMS, Azure Test Plans | TCM | Mixed | Covered briefly in §5 |

Important: **Test IO is not apples-to-apples** with TestForge. Test IO sells *people*
(exploratory crowdtesting, hundreds of real devices, output in the form of bug reports), not
*software* for managing test cases. The only Test IO features worth borrowing for TestForge are
the concepts of *exploratory/session-based testing* and *attachment-rich bug reports* — both are
on the TODO list in §7.

---

### 2. Comparison table at a glance

Legend: ✅ present · 🟡 partial/limited · ❌ absent · ➖ not relevant for that product category.

| Feature | TestForge | TestRail | Qase | TestLink | Test IO |
|---|:-:|:-:|:-:|:-:|:-:|
| **Organisation & structure** |
| Multi-project | ✅ | ✅ | ✅ | ✅ | ➖ |
| Suite → section hierarchy (nested) | ✅ | ✅ | ✅ | ✅ | ➖ |
| Multi-tenant organization/workspace | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Test case design** |
| Structured steps (action + expected) | ✅ | ✅ | ✅ | ✅ | ➖ |
| Auto ID (`TC-SLUG-001`) | ✅ | ✅ | ✅ | ✅ | ➖ |
| Priority / type / tags / assignee | ✅ | ✅ | ✅ | 🟡 (keywords) | ➖ |
| Clone & bulk edit | ✅ | ✅ | ✅ | 🟡 | ➖ |
| Soft delete / recycle bin | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Attachments / images on cases & results** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Custom fields** | ✅ (9 types) | ✅ (very strong) | ✅ | ✅ | ➖ |
| **Shared steps (reusable steps)** | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Case versioning / change history** | ✅ | ✅ | ✅ | ✅ | ➖ |
| **Parameterisation / datasets** | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Case templates (text/BDD/exploratory)** | ✅ (BDD + exploratory session) | ✅ | 🟡 | ❌ | ➖ |
| Rich text / markdown + inline images | ✅ (GFM) | ✅ | ✅ | 🟡 | ➖ |
| Review/approval workflow for cases | ❌ | 🟡 | ✅ | ❌ | ➖ |
| **Planning & execution** |
| Test run + pick cases via filter | ✅ | ✅ | ✅ | ✅ | ➖ |
| 7 colour-coded result statuses + keyboard shortcuts | ✅ | ✅ | ✅ | 🟡 | ➖ |
| Automatic timer per result | ✅ | 🟡 (manual elapsed) | ✅ | ❌ | ➖ |
| Rerun failed only | ✅ | ✅ | ✅ | ❌ | ➖ |
| Milestones | ✅ (basic) | ✅ (+sub-milestones) | ✅ | 🟡 (builds) | ➖ |
| **Test plans (collection of runs + configurations)** | ✅ | ✅ | ✅ | ✅ | ➖ |
| **Configurations (browser × OS matrix)** | ✅ | ✅ | ✅ | ✅ (platforms) | ➖ |
| **Environments per run** | ✅ | 🟡 | ✅ | ❌ | ➖ |
| **Custom result statuses** | ❌ (hardcoded) | ✅ | ✅ | ✅ | ➖ |
| Time estimates & forecast | ❌ | ✅ | 🟡 | ❌ | ➖ |
| Exploratory / session-based testing | ✅ | 🟡 (template) | 🟡 | ❌ | ✅ (core product) |
| **Requirements & traceability** |
| Requirement management + coverage matrix | ❌ | 🟡 (via references) | 🟡 (via Jira) | ✅ (strongest) | ➖ |
| Two-way case ↔ issue tracker linking | 🟡 (URL string) | ✅ | ✅ | ✅ | ✅ |
| Built-in defect entity | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Automation** |
| JUnit XML upload via API | ✅ | 🟡 (via custom API) | ✅ | 🟡 (XML-RPC) | ➖ |
| Auto-match result ↔ case (ID annotation) | ✅ | 🟡 | ✅ | 🟡 | ➖ |
| Other formats (TRX/NUnit/Allure/Cucumber JSON) | 🟡 (TRX/NUnit3/xUnit2/Cucumber/Mocha, no Allure yet) | 🟡 | ✅ | ❌ | ➖ |
| Per-framework reporter/SDK (npm/pip) | ❌ | 🟡 (third party) | ✅ (10+ official) | ❌ | ➖ |
| CLI uploader | ❌ | ❌ | ✅ | ❌ | ➖ |
| Flaky detection | ✅ | ❌ | ✅ | ❌ | ➖ |
| Mute/quarantine flaky tests | ✅ | ❌ | ✅ | ❌ | ➖ |
| **Reporting** |
| Pass rate trend | ✅ | ✅ | ✅ | 🟡 | ➖ |
| Automation coverage | ✅ | 🟡 | ✅ | ❌ | ➖ |
| Run-to-run comparison | ❌ | ✅ | ✅ | ❌ | ➖ |
| Custom dashboards (widgets) | ❌ | ✅ | ✅ | ❌ | ➖ |
| Cross-project reporting | ❌ | ✅ (Enterprise) | ✅ | ❌ | ➖ |
| Scheduled/email reports | ❌ | ✅ | 🟡 | ❌ | ✅ |
| PDF/print report export | ✅ | ✅ | ✅ | ✅ | ✅ |
| Public share link (read-only) | ❌ | 🟡 | ✅ | ❌ | ➖ |
| **Integrations** |
| REST API + OpenAPI | ✅ | ✅ (no official OpenAPI) | ✅ | 🟡 (XML-RPC) | ✅ |
| Webhooks (HMAC-signed) | ✅ | 🟡 | ✅ | ❌ | ✅ |
| Native Jira integration | 🟡 (create/link/status; no Jira-side plugin yet) | ✅ (two-way plugin) | ✅ | ✅ | ✅ |
| GitHub/GitLab issues | ❌ | ✅ | ✅ | 🟡 | ➖ |
| Slack/Teams notifications | ✅ | ✅ | ✅ | ❌ | ✅ |
| Import from other tools (TestRail/Qase/XML) | ✅ (CSV + TestRail/Qase/TestLink) | ✅ | ✅ (TestRail, CSV) | ✅ (XML) | ➖ |
| CSV export | ✅ | ✅ (+XLSX/XML) | ✅ (+JSON) | ✅ (XML) | ➖ |
| **Collaboration** |
| Comments & @mentions on cases/runs | ❌ | 🟡 | ✅ | ❌ | ✅ |
| Activity feed / per-entity history | 🟡 (global audit log) | ✅ | ✅ | 🟡 | ➖ |
| Saved filters / saved views | ✅ (cases) | ✅ | ✅ | ❌ | ➖ |
| Global full-text search | ✅ (⌘K) | ✅ | ✅ | 🟡 | ➖ |
| **Security & admin** |
| RBAC (org + project roles) | ✅ (2 layers) | ✅ | ✅ (+custom roles) | ✅ | ➖ |
| Custom roles | ❌ | ✅ | ✅ | ✅ | ➖ |
| Email verification + password reset | ✅ | ✅ | ✅ | 🟡 | ➖ |
| OAuth login (Google/GitHub) | ✅ | 🟡 | ✅ | ❌ | ➖ |
| SSO SAML/OIDC | 🟡 (OIDC; SAML deferred) | ✅ (Enterprise) | ✅ | ❌ | ✅ |
| 2FA/TOTP | ✅ | ✅ | ✅ | ❌ | ✅ |
| SCIM provisioning | ❌ | 🟡 | ✅ | ❌ | ➖ |
| Audit log + export | ✅ | ✅ (Enterprise) | ✅ | ❌ | ➖ |
| Scoped API keys (READ/WRITE) + hashing | ✅ | 🟡 | ✅ | ❌ | ➖ |
| Rate limiting & brute-force lockout | ✅ | ✅ | ✅ | ❌ | ➖ |
| **Deployment & pricing** |
| Self-hosted | ✅ (Docker, one command) | ✅ (Enterprise Server, expensive) | ❌ | ✅ | ➖ |
| Open source | ✅ | ❌ | ❌ | ✅ | ➖ |
| Free tier | ✅ (everything is free) | ❌ (trial only) | ✅ (≤3 users) | ✅ | ❌ |
| Indicative price (cloud, per user/month) | Free | ~$37–74 | ~$20–40 | Free | per test cycle |
| UI i18n (EN/ID) | ✅ | 🟡 | 🟡 | ✅ (many languages) | ➖ |

---

### 3. Detailed comparison per feature area

#### 3.1 Test case design & organisation

- **TestRail** is the most flexible: *case templates* (Text, Steps, Exploratory Session, BDD),
  **custom fields** per template with 10+ field types (dropdown, multi-select, steps, URL,
  user, date…), **shared steps** used across cases and updated everywhere at once, per-case
  change history complete with diffs, and **datasets/parameterisation** (one case executed N
  times with different variables). The repository mode can be *single suite* or *multi-suite +
  baselines* (suite snapshots for parallel releases).
- **Qase** follows closely: shared steps, custom fields, per-case parameters, drag-and-drop
  attachments, *muted tests*, and a **review workflow** (cases in draft/in-review/actual status)
  that is more formal than TestRail's.
- **TestLink** is unique in its **keywords** (similar to tags) and built-in case versioning
  (every edit bumps the version, and a test plan pins a specific version — a good concept that
  neither TestForge nor modern Qase has).
- **TestForge** already had a good foundation (JSON action/expected steps, priority/type/status/
  automation status, tags, clone, bulk edit, inline priority & automation editing in the table,
  soft delete + scheduled purge) but **did not yet have**: attachments, custom fields, shared
  steps, versioning, parameterisation, templates, rich text. This was gap cluster №1.

#### 3.2 Planning & execution

- **TestRail**: *test plans* wrap many runs + **configurations** (a matrix — e.g.
  Chrome/Firefox × Win/macOS produces one run per combination), tiered milestones, per-case
  estimates and a **forecast** of remaining execution time, "todos" (a personal work queue per
  tester).
- **Qase**: test plans, environments (staging/prod), configurations, default assignee, a rerun
  wizard, and *fast run* (quick execution without creating a formal run).
- **TestLink**: test plan + **builds** (equivalent to runs) + **platforms** (equivalent to
  configurations).
- **Test IO**: execution is done by the crowd; its interesting features are the *test cycle*
  with a scope, a real device matrix, and bug reports with photo/video evidence.
- **TestForge**: single runs were already strong (7 statuses, `P/F/B/S/R` + `J/K` shortcuts,
  automatic timer, partial runs, rerun failed only, select-all, per-result assignee, defect URL,
  milestones). **Missing**: test plans, configurations, environments, custom statuses,
  estimates/forecast, exploratory sessions. This was gap cluster №2.

#### 3.3 Automation & CI/CD

- **Qase** is the strongest: official reporters for Playwright, Cypress, pytest, JUnit, TestNG,
  Jest, WebdriverIO, Robot Framework and more (publishing results in real time per test rather
  than one upload at the end), a `qase-cli` CLI, an API v2 for bulk results, and automation
  analytics (flaky, slowest, muted).
- **TestRail** relies on the `add_result_for_case` API + third-party integrations (railflow,
  trcli). The official `trcli` can parse JUnit XML.
- **TestForge** was already heading the right way: a framework-agnostic `POST /api/v1/junit`
  with auto-matching on `TC-WEB-001` annotations/exact titles, an `origin` column (CI vs local),
  flaky detection in reports, HMAC webhooks. **Missing**: formats other than JUnit (TRX, NUnit3,
  Allure, Cucumber JSON, Mocha JSON), official npm/pip reporters, a CLI, real-time result
  streaming, and flaky mute/quarantine. Gap cluster №3.

#### 3.4 Reporting & analytics

- **TestRail**: a separate report engine (activity, coverage, comparison across runs/milestones,
  property distribution), schedulable & emailable, cross-project (Enterprise).
- **Qase**: widget-based custom dashboards (query builder), run reports shareable as a public
  read-only link, PDF export.
- **TestForge**: pass rate trend per run, flaky, bug correlation, automation coverage — good for
  an MVP but static (cannot be composed or filtered), no run-to-run comparison, no share links,
  no PDF/scheduled reports. Gap cluster №4.

#### 3.5 Integrations & ecosystem

- **TestRail**: defect plugin integrations (Jira, Azure DevOps, GitHub, GitLab, Bugzilla,
  Redmine, YouTrack…) — push a defect from a failed result, see defect status inside TestRail,
  and on the Jira side a plugin shows test results from the issue.
- **Qase**: a two-way Jira app, GitHub/GitLab, Slack, webhooks.
- **TestLink**: classic bug tracker linking (Mantis, Bugzilla, Jira via connector).
- **TestForge**: `linkedIssues` was only a comma-separated URL string; `defectUrl` on run results
  was also a string. No create-issue-from-failure, no status sync, no Slack/Teams/Discord
  notifications. The per-project (HMAC) webhook is a good foundation for building this.
  Gap cluster №5.

#### 3.6 Collaboration & UX

- Qase/TestRail have per-case/per-result comments, @mentions, saved views, global search, and a
  per-entity activity stream. TestForge only had a global audit log (admin-facing), with no
  user-facing collaboration. Gap cluster №6.

#### 3.7 Enterprise & security

- TestForge was already decent (JWT + email verification, OAuth, lockout, rate limiting, hashed
  and scoped API keys, audit log + export, two-layer org/project RBAC). The remaining gap for
  serious team adoption: **SSO SAML/OIDC, 2FA, SCIM, custom roles, session management** (see §7
  P2).

---

### 4. Detailed profile per product

#### 4.1 TestRail

- **Strengths**: maturity (since 2004), the deepest custom fields & templates, test plans +
  configurations, baselines, forecast, the most complete report engine, the broadest defect
  plugin ecosystem, UI scripts (UI customisation via JS), large documentation & community.
- **Weaknesses**: expensive (cloud ~$37/user/month Professional, ~$74 Enterprise; server is
  Enterprise-only), the UI feels dated, the API has no official OpenAPI and strict cloud rate
  limits, no free tier, first-class automation only arrived via `trcli` (which feels bolted on),
  not open source.
- **Lesson for TestForge**: shared steps, configurations, forecast, defect plugin architecture,
  saved views ("filters") — the features that keep large manual QA teams on board.

#### 4.2 Qase

- **Strengths**: modern and fast UX, a free tier, the most official automation reporters, a case
  review workflow, a built-in defect entity, dashboard widgets, public share links, tidy API
  v1+v2, SSO/SCIM on business plans, AI features (generate cases from a description/document,
  AIDEN).
- **Weaknesses**: no self-hosting (a deal-breaker for data-sensitive teams), enterprise features
  locked behind top tiers, configurations/environments not as deep as TestRail plans.
- **Lesson for TestForge**: positionally, TestForge is closest to "an open source Qase". Priority
  features to emulate: attachments, per-framework reporters, report share links, review
  workflow, defects.

#### 4.3 TestLink

- **Strengths**: free & GPL, the best-in-class **requirement management + traceability matrix**
  (import requirements, link to cases, requirement coverage reports), case versioning + test
  plans pinning versions, platforms, many languages.
- **Weaknesses**: an old PHP monolith, a 2000s frame-based UI, the last stable release is years
  old (1.9.x), an antiquated XML-RPC API, no modern automation, a troublesome install.
- **Lesson for TestForge**: TestLink proves that the open-source-self-hosted segment is real and
  is currently *vacant*, abandoned by modern players — precisely TestForge's target. Worth
  borrowing: requirement traceability and case versioning.

#### 4.4 Test IO

- **Strengths**: hundreds of thousands of human testers, a real device matrix (not emulators),
  rich bug reports (screenshots, video, reproduction steps), on-demand test cycles, bug tracker
  integrations.
- **Weaknesses**: not a TCM — it does not manage a team's internal test case repository;
  expensive; crowd quality varies.
- **Lesson for TestForge**: support *exploratory sessions* and *media-rich bug reports* so that
  the output of manual testers (internal or crowd) can live in TestForge.

---

### 5. Other tools worth watching

| Tool | In brief | Differentiating feature relevant to TestForge |
|---|---|---|
| **Zephyr Scale** (SmartBear) | TCM native to Jira | Automatic issue↔case traceability, BDD, versioning |
| **Xray** | TCM native to Jira, strong on automation | Requirement coverage, first-class Cucumber, test environments |
| **Testmo** | Modern unified TCM | One place for manual + automation + **exploratory sessions**; excellent CLI for submitting automation results |
| **PractiTest** | Enterprise TCM | Full requirements module, strong dashboards, exploratory |
| **qTest** (Tricentis) | Enterprise TCM | Cross-project insights, Tricentis Tosca integration |
| **Allure TestOps** | Automation-first TCM | Test cases as code, real-time launches, the deepest automation analytics |
| **Kiwi TCMS** | Open source (Python/Django) — the closest OSS competitor | Test plans + versioning, API, telemetry reports; UI older than TestForge's |
| **Testiny** | Lightweight modern TCM, inexpensive | Fast UX, small self-hosted free tier |
| **Azure Test Plans** | Part of Azure DevOps | Configurations, exploratory testing with screen recording |
| **TestLodge, Tuskr, QA Touch, TestCollab** | Lightweight TCM | Basic features, price is the main differentiator |

---

### 6. TestForge's strengths at the time of writing

What was already **better than or on par with** competitors (do not break these while chasing
the gaps):

1. **Open source + one-command self-hosting** (`docker compose up`) — something neither
   TestRail (expensive server) nor Qase (none at all) offers. This is the main differentiator.
2. **Fast run execution**: 7 statuses, `P/F/B/S/R` keyboard shortcuts + `J/K` navigation,
   automatic timer, rerun failed only — on par with or more ergonomic than TestRail.
3. **Framework-agnostic JUnit ingest + annotation auto-matching** — simpler to use than
   TestRail's API.
4. **Built-in flaky detection, free** — a paid-tier feature in Qase.
5. **API v1 with an OpenAPI spec** (`/api/v1/openapi`) — even TestRail has no official OpenAPI.
6. **Tidy security basics**: hashed and scoped API keys, HMAC webhooks, lockout, audit log +
   export.
7. **EN/ID i18n** — almost no competitor offers Indonesian.
8. **CSV import with preview & validation** + per-step expected export.

---

### 7. Gap Analysis → TODO features

> Priority: **P1** = the gaps most often cited as reasons a team rejects a TCM (compared to
> Qase/TestRail); **P2** = important competitive differentiators; **P3** = nice-to-have /
> niche segments.
> This checklist is the feature backlog — mark ✅ on release.

#### P1 — Foundations TestRail/Qase users consider mandatory

- [x] **Attachments & inline images** — upload files/screenshots on test cases, steps, and run
      results (drag-drop + paste from clipboard); local storage (Docker volume) with an
      abstraction so it can be S3-compatible. *The most frequently asked-about gap; every
      competitor has it.* *(Done 2026-07-08 — upload/dedupe/limit/purge live; inline images in
      descriptions waited on F-02 markdown.)*
- [x] *(Done 2026-07-09 — 9 field types for cases & results; table columns/filters followed)*
      **Custom fields** — per-project field definitions (types: text, dropdown, multi-select,
      checkbox, URL, user, date) for test cases and run results; shown in forms, tables,
      filters, CSV import/export, and the API.
- [x] *(Done 2026-07-10)* **Shared steps** — reusable steps across cases (e.g. "log in as
      admin"); edit once, updated in every case that uses it; counted correctly in exports and
      the run view.
- [x] *(Done 2026-07-10)* **Test case history & versioning** — store a revision on every change
      (who, when, per-field/per-step diff), show it on a History tab, allow restoring a version;
      run results store a snapshot of the case version as executed (like TestLink).
- [x] *(Done 2026-07-10)* **Test plans + configurations** — a Test Plan entity containing many
      runs; configurations (e.g. Browser: Chrome/Firefox × OS: Win/macOS) produce one run per
      combination; aggregate progress per plan. *TestRail's main differentiating feature.*
- [x] **Rich text (markdown)** for description/preconditions/steps + safe (sanitized) rendering
      and inline images from attachments. *(Done 2026-07-08 — GFM + rehype-sanitize, a
      Write/Preview editor, paste screenshot → attach + embed.)*
- [x] *(Done 2026-07-10)* **Jira integration** (then GitHub/GitLab Issues) — not just a URL
      string: create an issue from a FAILED result with an automatic template (repro from
      steps), two-way linking, live issue status shown on the case/run, per-project
      configuration. *(A Jira-side plugin showing test results inside the issue does not exist
      yet.)*
- [x] *(Done 2026-07-10)* **Slack/Discord/Teams + email notifications** — run finished, failed
      results, case assigned; built on top of the existing webhook system.
- [x] *(Done 2026-07-09)* **Global search** — one search box (⌘K) across cases/runs/suites/
      milestones with full-text search on title/description/steps.
- [x] *(Done 2026-07-09 for cases; runs followed)* **Saved filters / views** — save a
      combination of case & run table filters (per user and shared per project), and set it as
      the default view.

#### P2 — Competitive differentiators (on par with Qase/TestRail business plans)

- [x] *(Done 2026-07-11)* **Additional automation result formats** — TRX (MSTest), NUnit3,
      xUnit v2, Cucumber JSON, and Mocha JSON parsers on a generic `/api/v1/results` endpoint
      (JUnit keeps working through `/api/v1/junit`); Allure not yet.
- [x] *(Done 2026-07-13)* **Official per-framework reporters** — npm packages
      `testforge-playwright-reporter`, `testforge-cypress-reporter`, pip `pytest-testforge`
      streaming results in real time (not just an XML upload at the end), + a **`testforge-cli`
      CLI** for CI. Publishing to npm/PyPI is still manual. See F-12.
- [x] *(Done 2026-07-12)* **Parameterisation / datasets** — `{{param}}` variables in steps + a
      per-case dataset table; a run executes one dataset row as one result.
- [x] *(Done 2026-07-12)* **Custom result statuses & custom roles** — admins can add/change
      result statuses (colour, pass/fail meaning) and create roles with granular permissions.
      See F-14.
- [x] *(Done 2026-07-12)* **Case review workflow** — a `DRAFT → IN_REVIEW → APPROVED` flow with
      reviewers, review comments, and a "needs review" filter (like Qase). See F-15.
- [x] *(Done 2026-07-12)* **Comments & @mentions** — comments on cases and run results; mentions
      trigger a notification/email. The attachment uploader in the comment composer was deferred
      (it needs a two-phase draft-id flow). See F-16.
- [x] *(Done 2026-07-13)* **Dashboards & report builder** — composable widgets (pass rate,
      coverage, defects, velocity) per project; **run/milestone comparison**; **scheduled email
      reports**; a **public read-only share link** for run reports. **Dashboard PDF export was
      NOT built** (share links were considered sufficient); PDF for the case catalogue & run
      report is available via the browser print dialog in F-35. See F-17.
- [x] *(Done 2026-07-13)* **Requirement management & traceability** — a Requirement entity, N:M
      links to cases, a requirement→case→latest-result coverage matrix (filling the vacuum left
      by TestLink). Import via CSV paste; the reverse picker on case detail was deferred.
      See F-18.
- [x] *(Done 2026-07-12)* **Environments** — a per-project list of environments (staging/prod/…),
      selected when creating a run, and a filter dimension in reports.
- [x] *(Done 2026-07-16)* **SSO OIDC + 2FA (TOTP)** — generic OIDC (covering Google
      Workspace/Azure AD/Keycloak) + TOTP 2FA with recovery codes. **SAML & SCIM are
      deliberately out of scope** and were not built. LDAP/AD followed in F-34. See F-20.
- [x] *(Done 2026-07-12)* **Mute/quarantine tests** — mark an automation case as muted; its
      results are recorded but do not fail the pass rate; report long-muted tests.
- [x] *(Done 2026-07-12)* **Import from TestRail/Qase/TestLink** — TestRail XML, Qase JSON
      export, and TestLink XML importers (not just CSV) to lower migration cost.
- [x] *(Done 2026-07-12)* **Estimates & forecast** — a per-case estimate field, aggregated per
      run/plan, forecasting remaining time from the tester's actual pace. See F-23.
- [x] *(Done 2026-07-11)* **Bulk move/copy across suites & projects** + drag-and-drop case
      reordering within a suite. Moving between suites via drag-drop turned out to have existed
      for a long time; only Copy-to-project and drag-reorder were newly added.

#### P3 — Nice-to-have / niche segments

- [x] *(Done 2026-07-17)* **Exploratory / session-based testing** — a Session entity (charter,
      timebox, timestamped notes, attachments) producing new bugs/cases (the Test IO/Testmo
      lesson). See F-25.
- [x] *(Done 2026-07-17)* **Built-in defect entity** — an internal defect list for teams without
      an issue tracker (like Qase), still linkable to an external tracker. See F-26.
- [x] *(Done 2026-07-17)* **BDD/Gherkin** — a Gherkin case template, `.feature` import/export,
      synchronised with Cucumber JSON results. See F-27.
- [x] *(Done 2026-07-17)* **Baselines** — suite snapshots supporting several parallel release
      versions (the TestRail concept). See F-28.
- [x] *(Done 2026-07-18)* **AI assist (BYO key)** — generate draft test cases from a feature
      description/PRD, suggest edge-case steps, and detect similar cases (local trigram, no key
      required) — the answer to Qase AIDEN. An Anthropic-compatible endpoint + a per-org
      encrypted key; opt-in per click, fully off when unconfigured (F-29).
- [x] *(Done 2026-07-17)* **XLSX & JSON export** (besides CSV), import templates with saved
      column mappings. See F-30.
- [x] *(Done 2026-07-17)* **Todos / personal work queue** — an "assigned to me" page across
      projects (run results + assigned cases, + reviews requested) like TestRail Todos.
      See F-31.
- [x] *(Done 2026-07-17)* **Case dependencies** — mark cases that depend on other cases; the run
      suggests (does not automatically apply) BLOCK on dependents when a prerequisite fails.
      See F-32.
- [x] *(Done 2026-07-18)* **Public API v2** — full coverage (milestones, members, webhooks,
      custom fields, attachments), per-project tokens, per-key rate limits, plus a
      `packages/api-client` package generated from the spec. v1 keeps running and is frozen.
      See F-33.
- [x] **LDAP/Active Directory** for self-hosted enterprise (feature parity with TestLink/Kiwi).
- [x] *(Done 2026-07-18)* **Print-friendly view** of test cases & runs for audit/compliance — a
      dedicated `/print/*` route (case catalogue + run report), PDF via the browser print
      dialog, with no server-side dependency (F-35).
- [x] *(Done 2026-07-18)* **PWA/mobile execution view** — an installable PWA (manifest + icons +
      offline-fallback service worker), a single-card thumb-zone executor on phones, and an
      **offline result queue** (record without signal, auto-sync when online, last-write-wins
      conflicts reported) for physical device testing (F-36).
- [x] *(Done 2026-07-11)* **In-app docs/help center** — `/docs/help`, per-feature-area how-to
      guides for end users (separate from `/docs/api`, which is for developers). See F-37.
- [x] *(Done 2026-07-16)* **Live quality badge** — a public shields.io-style SVG per project
      (`/badge/<token>.svg`, pass rate / automation / case count), revocable token; no competitor
      has this. See L-01.
- [x] *(Done 2026-07-16)* **Real-time collaborative run execution** — TestRail/Qase runs are
      single-player with a refresh; TestForge is multiplayer: presence avatars, live results via
      SSE, soft claim, last-write-wins conflicts + Undo. See L-04.
- [x] *(Done 2026-07-16)* **CI quality gates** — TestRail/Qase require scripting; TestForge does
      it in one call: a per-project policy (pass rate, new failures, untested, required tags) +
      `testforge-cli gate` with an exit code. See L-02.
- [x] *(Done 2026-07-16)* **Test cases as code (GitOps sync)** — unique, no TCM competitor has
      it: a `tests/` YAML folder in the user's repo synced two ways (`cases pull|status|push`),
      3-way merge via `.testforge.lock`, conflicts exit 1 with a per-field report (it never
      silently overwrites). See L-03 & `docs/CASES-AS-CODE.md`.

#### Implementation notes

- The suggested order within P1: **attachments → rich text → custom fields → Jira → test
  plans/configurations** (attachments & rich text are UX prerequisites for the rest).
- The existing HMAC webhook is the foundation for Slack/Teams notifications (P1) and tracker
  integration (P1) — build them as internal webhook consumers, not as a new system.
- The current schema stores `tags`, `linkedIssues`, and `events` as comma-separated strings;
  when working on custom fields/integrations, consider normalising them into relational tables
  at the same time (a Prisma migration), especially before moving to PostgreSQL in production.
## Part IV — Feature Work Orders

*Source document: `docs/TODO-FEATURES.md`. Reproduced verbatim; original title: "TestForge — Feature TODO Specifications (Implementation Work Orders)".*

> **Purpose.** This document is the executable backlog for TestForge. Every feature below is
> written as a **self-contained work order**: exact data model, exact file paths, function
> signatures, API contracts, acceptance criteria, edge cases, and test plan. An implementer
> (human or AI agent) should be able to build any feature from its section alone, without
> asking questions.
>
> **Origin.** Gap analysis vs TestRail, Qase, TestLink, Test IO and others — see
> [Part III — Competitive Comparison](#part-iii--competitive-comparison). The **Leapfrog** section (L-01…L-05)
> contains features designed to make TestForge *better* than every competitor, not just equal.
>
> Created: 2026-07-08. Status legend: `[ ]` not started · `[x]` shipped.

---

### Table of contents

- [0. Read this first: repo conventions every feature MUST follow](#0-read-this-first-repo-conventions-every-feature-must-follow)
- [1. Definition of Done (applies to every feature)](#1-definition-of-done-applies-to-every-feature)
- [2. Recommended build order & dependencies](#2-recommended-build-order--dependencies)
- [3. P1 features (F-01 … F-10) — full work orders](#3-p1-features)
- [4. P2 features (F-11 … F-24) — compact work orders](#4-p2-features)
- [5. P3 features (F-25 … F-36) — scoped briefs](#5-p3-features)
- [6. Leapfrog features (L-01 … L-05) — beat the competition](#6-leapfrog-features)
- [7. Appendix — Fable design handoff](#7-appendix--fable-design-handoff-written-2026-07-13)
- [8. Post-backlog features (F-38 …)](#8-post-backlog-features)

---

### 0. Read this first: repo conventions every feature MUST follow

The implementer must copy these existing patterns, not invent new ones.

#### 0.1 Stack & layout

| Thing | Where / What |
|---|---|
| Framework | Next.js 14 App Router, TypeScript, Tailwind CSS |
| Path alias | `@/` → `src/` (e.g. `import { db } from "@/lib/db"`) |
| Pages | `src/app/(app)/projects/[slug]/...` (authed app), `src/app/...` (public) |
| Data mutations | Server actions in `src/app/actions/*.ts` (`"use server"` at top) |
| REST API | `src/app/api/v1/.../route.ts` (public v1), `src/app/api/...` (internal) |
| DB | Prisma, schema at `prisma/schema.prisma`. **SQLite in dev** (`npx prisma db push`), PostgreSQL-portable — therefore **no Prisma `enum`**, use `String` + comment listing allowed values; **no `Json` type**, use `String` columns named `*Json` |
| Shared helpers | `src/lib/*.ts` (`auth`, `api`, `db`, `audit`, `webhooks`, `constants`, `projects`, `mailer`, `rate-limit`, `i18n`) |
| UI components | `src/components/PascalCase.tsx`, client components with `"use client"`, Tailwind classes, icons via `TFIcon` |
| E2E tests | Playwright in `e2e/*.spec.ts` (see `e2e/smoke.spec.ts`) |
| Seed/demo data | `prisma/seed.mjs` |

#### 0.2 Mandatory server-action pattern

Copy the shape of `src/app/actions/cases.ts`:

```ts
"use server";
export async function doThing(_prev: { error?: string } | undefined, formData: FormData) {
  const session = await requireSession();                       // 1. auth
  if (session.role === "VIEWER") return { error: "Viewers don't have write access." }; // 2. RBAC
  // 3. tenant guard: entity must belong to a project the user is a member of
  //    (copy assertCaseAccess / isProjectMember pattern)
  // 4. validate input; on failure: return { error: "..." } (NEVER throw for user errors)
  // 5. db mutation
  await logAudit({ userId: session.userId, action: "entity.verb", entityType, entityId, detail }); // 6. audit
  revalidatePath(...); // or redirect(...)                       // 7. cache
}
```

Audit `action` naming is always `entity.verb` lowercase: `case.create`, `run.complete`, `attachment.upload`.

#### 0.3 Mandatory API v1 pattern

Copy the shape of existing routes in `src/app/api/v1/projects/[slug]/...`:

- First line of every handler: `const auth = await guard(req)` (or `guard(req, { write: true })`
  for mutations) from `@/lib/api`; if `auth instanceof NextResponse` return it.
- Errors: **only** via `apiError` / `badRequest` / `validationError` / `notFoundError` /
  `forbidden` from `@/lib/api` — envelope is `{ error: { code, message, details? } }`.
- Every resource gets a `serializeX()` function in `src/lib/api.ts` — the single source of
  truth for its JSON shape. Dates are ISO strings.
- List endpoints use **cursor pagination**: `?cursor=<id>&limit=<n>` (default 50, max 200),
  response `{ items: [...], nextCursor: string | null }`.
- **Every new/changed endpoint must be added to the OpenAPI spec** in `src/lib/openapi.ts`
  (served at `/api/v1/openapi`) and to the human docs page `src/app/docs/api`.

#### 0.4 Webhooks

New entity mutations should fire webhooks: add event names to `WEBHOOK_EVENTS` in
`src/lib/webhooks.ts` (format `entity.verb`), call `dispatchWebhook(projectId, event, data)`
after the DB write. Delivery is fire-and-forget; never await it in a way that blocks the response.

#### 0.5 i18n

Public pages (landing/auth) are translated via `src/lib/i18n.ts` (cookie `tf_lang`, `en`/`id`).
**The internal app UI is English-only for now** — write all new app UI strings in English
directly; do not add app strings to `i18n.ts` unless the feature is on a public page.

#### 0.6 Git & delivery rules (from README, non-negotiable)

- Never commit/push to `main`. Branch `feat/<slug>` → PR → CI green → merge (auto-deploys prod).
- Never commit `.env`, secrets, `*.db`. Minimal diff — do not refactor unrelated code.
- One feature (one `F-xx`) per branch/PR unless stated otherwise.

#### 0.7 Environment variables

New env vars must: have a safe default for `docker compose up` zero-config startup, be added to
`docker-compose.yml` + `docker-compose.prod.yml` (commented), and be documented in `README.md`
and `docs/SELF-HOSTED-MIGRATION.md` if they affect data location.

#### 0.8 Which model to use (for AI implementers)

Every feature in §2 carries a **Model** recommendation. The rule of thumb: features that
introduce a *new architectural concept* get the strongest model; features that follow patterns
already established in this repo do not.

**Checking the current model.** A model's self-report about its own identity is unreliable —
the environment block in a system prompt can be stale after a mid-session switch. Read the
session transcript instead, which records the model per message:

```bash
jq -r 'select(.message.model != null) | .message.model' \
  ~/.claude/projects/-Users-<user>-testforge/<session-id>.jsonl | uniq -c | tail -3
```

**On mismatch.** Claude has no tool to change its own model mid-session — `/model` is a
user-invoked command. So the agent must **stop and ask the user to run `/model <id>`** rather
than proceeding on the wrong model or pretending it switched. Switch only at section
boundaries: a mid-section switch invalidates the prompt cache and re-reads the whole context.

| Model | `/model <id>` | Use for |
|---|---|---|
| Fable 5 | `claude-fable-5` | New architecture, cross-cutting redesign, security-critical design |
| Opus 4.8 | `claude-opus-4-8` | Well-specified features following existing repo patterns (supports `/fast`) |
| Sonnet 5 | `claude-sonnet-5` | Mechanical work: CSV columns, docs, small UI, test fixtures |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | Trivial edits, one-line doc fixes |

---

### 1. Definition of Done (applies to every feature)

A feature is **done** only when all boxes below are checked:

1. [ ] Prisma schema updated; `npx prisma db push` works on a fresh SQLite DB **and** on an
       existing dev DB without data loss; `prisma/seed.mjs` extended so demo data shows the feature.
2. [ ] Server actions follow §0.2 (auth → RBAC → tenant guard → validate → mutate → audit → revalidate).
3. [ ] API v1 endpoints follow §0.3, including serializers, cursor pagination, OpenAPI spec update.
4. [ ] Webhook events added per §0.4 where the feature mutates entities.
5. [ ] UI matches existing look (Tailwind, `TFIcon`, same table/form styles as `CasesTable.tsx` / `CaseForm.tsx`).
6. [ ] CSV import/export (`src/app/api/import/cases`, `src/app/api/export/*`) updated if the
       feature adds/changes case or result fields, including the template at `api/templates/cases-csv`.
7. [ ] At least one Playwright e2e spec in `e2e/` covering the happy path, runnable via existing config.
8. [ ] `README.md` feature list gets one line; `FEATURE-COMPARISON.md` table cell flipped to ✅.
9. [ ] `npm run build` passes (this is what CI runs).

---

### 2. Recommended build order & dependencies

Model column per §0.8 — check the running model before starting a row, and ask the user to
switch if it does not match.

| Order | Feature | Depends on | Why this order | Model |
|---|---|---|---|---|
| 1 | F-01 Attachments | — | Prerequisite for F-02 image paste, F-16 comments, F-25 sessions | ✅ done |
| 2 | F-02 Markdown | F-01 | Prerequisite UX for everything text-heavy | ✅ done |
| 3 | F-09 Global search | — | Independent, high visible value, small | ✅ done |
| 4 | F-10 Saved views | — | Independent, small | ✅ done |
| 5 | F-03 Custom fields | — | Touches CSV + API broadly; do before importers (F-22) | ✅ done |
| 6 | F-04 Shared steps | — | Touches steps rendering everywhere | ✅ done |
| 7 | F-05 Case versioning | F-04 (snapshots must expand shared steps) | Snapshot format must be final-ish | ✅ done |
| 8 | F-08 Notifications | — | Reuses webhook infra | ✅ done |
| 9 | F-07 Jira/GitHub/GitLab | F-08 (shares config UI section) | Highest-demand integration | **Opus 4.8** — spec is detailed, `lib/crypto.ts` already exists; but tokens are involved, so hold the line on §0.6 secret rules |
| 10 | F-06 Test plans & configurations | — | Biggest P1; schedule when above are stable | **Fable 5** — the only P1 that adds a genuinely new entity graph (plan → config matrix → generated runs → aggregate progress) |
| 11 | F-11 Additional automation result formats | — | Mechanical: one parser per format, same matching pipeline | ✅ done |
| 12 | F-24 Bulk move/copy & drag reorder | — | Mechanical; move-to-suite already existed, only copy+reorder were missing | ✅ done |
| 13+ | P2 (F-12…F-23), then P3 | see each | L-01/L-02 are small — ship early for marketing | **Sonnet 5** for the mechanical ones (F-13 datasets, F-23 estimates); **Opus 4.8** where a new subsystem appears (F-16 comments, F-20 SSO) |
| — | L-01…L-05 leapfrog, interleaved | see each | Designed to beat competitors, not match them | ~~Fable 5~~ → **Opus 4.8**: net-new design, but Fable wrote full work orders inline (2026-07-13, §7.5) — build from those |

---

### 3. P1 features

---

#### F-01 — Attachments & file uploads `[x]`

> **Status: DONE** (2026-07-08, branch `feat/attachments`). Implemented as specified, with
> these deliberate deviations:
> - Mutations live in the v1 API routes only (`guard()` covers both session & API-key auth,
>   audit is logged there) — no separate `src/app/actions/attachments.ts`; the UI uploads
>   via `fetch` to the API.
> - **Bonus:** sha256 dedupe per project (identical bytes stored once — the VPS disk is
>   small) plus a `GET /api/v1/projects/[slug]/attachments` list endpoint.
> - Demo seed data omitted (a seeded attachment row would point at a file that doesn't
>   exist on a fresh disk).
> - e2e covers the happy path (upload → inline serving → delete → 404); the size-limit and
>   non-member-404 ACs are enforced server-side but not e2e-automated yet.

**Goal.** Upload files (screenshots, logs, any file) onto test cases and run results; view/download
them; images render as thumbnails. This is the single most-cited missing feature vs every competitor.

##### Data model (add to `prisma/schema.prisma`)

```prisma
model Attachment {
  id         String   @id @default(cuid())
  projectId  String
  uploaderId String
  entityType String   // "CASE" | "RESULT" | "COMMENT" | "SESSION"  (extensible)
  entityId   String
  filename   String   // original name, sanitized (see rules below)
  mimeType   String
  sizeBytes  Int
  sha256     String
  storageKey String   // relative path inside the storage root, e.g. "p_<projectId>/<cuid>"
  createdAt  DateTime @default(now())

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  uploader User    @relation(fields: [uploaderId], references: [id])

  @@index([entityType, entityId])
}
```

Add the back-relations `attachments Attachment[]` on `Project` and `User`.

##### Storage abstraction — new file `src/lib/storage.ts`

```ts
export interface StorageDriver {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;        // throws if missing
  delete(key: string): Promise<void>;       // no-op if missing
}
export function getStorage(): StorageDriver; // returns LocalDriver today
```

- `LocalDriver` writes under `process.env.TF_UPLOAD_DIR ?? "./data/uploads"`.
  Create directories recursively. `storageKey` must never contain `..` or start with `/`
  (reject at write time). Keep the interface S3-ready but implement **local only** now.
- Add `./data` as a Docker volume in both compose files.

##### Rules & limits

- Max size: `TF_MAX_UPLOAD_MB` env, default **10**. Reject larger with HTTP 413 (API) or
  form error (action).
- Filename sanitization: strip path separators, control chars; keep extension; if empty after
  sanitizing, use `"file"`.
- **Never trust client MIME for rendering decisions.** Serving rules:
  - `image/png|jpeg|gif|webp` → serve inline (`Content-Disposition: inline`).
  - **Everything else, including `image/svg+xml` and `text/html`** → force
    `Content-Disposition: attachment` (SVG/HTML inline = stored XSS).
  - Always send `X-Content-Type-Options: nosniff`.
- Access control on download: requester must be a member of `attachment.projectId`
  (session or API key user). Return 404 (not 403) for non-members to avoid existence leaks.

##### Endpoints

| Method & path | Auth | Behavior |
|---|---|---|
| `POST /api/v1/projects/[slug]/attachments` | `guard(req, {write:true})` + project membership | `multipart/form-data` with fields `file`, `entityType`, `entityId`. Validates entity exists in this project. Returns `201` + `serializeAttachment(a)` |
| `GET /api/attachments/[id]` | session or Bearer, membership | Streams file per serving rules above |
| `DELETE /api/v1/projects/[slug]/attachments/[id]` | write | Deletes row + file. Uploader, project OWNER/ADMIN, or org ADMIN only |

`serializeAttachment` (add to `src/lib/api.ts`): `{ id, filename, mimeType, sizeBytes, entityType, entityId, uploaderId, url: "/api/attachments/"+id, createdAt }`.

##### Server actions — new file `src/app/actions/attachments.ts`

`uploadAttachment(formData)` and `deleteAttachment(formData)` following §0.2. Audit actions:
`attachment.upload` (detail = filename), `attachment.delete`.

##### UI

- New component `src/components/AttachmentUploader.tsx` (`"use client"`):
  - Props: `{ entityType, entityId, projectId, attachments: SerializedAttachment[] }`.
  - Drag-and-drop zone + file picker button + **paste from clipboard** (`onPaste`, take
    `clipboardData.files`).
  - Grid of existing attachments: image thumbnails (`<img loading="lazy">`), non-images as a
    file-icon card with filename + size (`KB`/`MB` formatted); delete button (with `confirm()`).
  - Uploads via `fetch` to the v1 endpoint with progress state (disable while uploading).
- Mount it: case detail page (below steps), `RunExecutor.tsx` (inside the per-result comment
  area — attach evidence to a result while executing).

##### Cleanup

Extend the existing purge cron (`src/app/api/cron/purge` + `src/lib/cases-purge.ts`): when a
soft-deleted case is purged, delete its attachments' rows **and files**. Also add an orphan
sweep: attachments whose `entityId` no longer resolves → delete (log count to console).

##### Acceptance criteria

1. Given a MEMBER on a case page, when they drop a 2 MB PNG, then it appears as a thumbnail
   without page reload, and `GET /api/attachments/[id]` returns it inline.
2. Given an 11 MB file (default limit), upload is rejected with a visible error; nothing is stored.
3. Given a user who is not a member of the project, `GET /api/attachments/[id]` returns 404.
4. Given an uploaded `.svg`, downloading it sends `Content-Disposition: attachment`.
5. Given a VIEWER, the uploader UI is hidden and the POST endpoint returns 403.
6. Purging a deleted case removes its attachment files from disk.

##### Test plan

- e2e `e2e/attachments.spec.ts`: login → open seeded case → upload fixture PNG → assert thumbnail
  → download URL returns 200 → delete → assert gone.
- Unit-ish (can be an e2e API test): size limit 413; non-member 404; SVG disposition header.

---

#### F-02 — Markdown rich text with inline images `[x]`

> **Status: DONE** (2026-07-08, branch `feat/markdown`). Implemented as specified, with
> these notes:
> - Read-side rendering covers case detail + run executor (description, preconditions,
>   step action/expected, expected result); styles are hand-rolled under `.tf-markdown`
>   in `globals.css` (no typography plugin).
> - `MarkdownEditor` replaces the textareas in `CaseForm` (description, preconditions,
>   overall expected result) and the run executor's notes box; supports both uncontrolled
>   (`name`/`defaultValue` in forms) and controlled (`value`/`onChange`) modes.
> - Paste-a-screenshot works where the entity already exists (case **edit** form and run
>   executor notes — uploads via the F-01 API, inserts `![](/api/attachments/…)`); on the
>   **new-case** form there is no entity id yet, so paste-upload is disabled there by design.
> - Step editors in `CaseForm` remain plain textareas per spec (Markdown renders in read
>   views); run-result notes render via the editor's Preview tab.
> - e2e `markdown.spec.ts` covers GFM rendering, script-injection inertness, and the
>   Preview tab; the `javascript:` image-src block is enforced in `urlTransform`.

**Goal.** `description`, `preconditions`, step `action`/`expected`, run-result comments render
Markdown (GFM) with inline images pasted from clipboard. Competitors have WYSIWYG; Markdown +
paste-to-upload is simpler and beats them for engineer-heavy teams.

##### Dependencies (add to `package.json`)

`react-markdown`, `remark-gfm`, `rehype-sanitize`. **No raw HTML pass-through** — the default
sanitize schema, plus allow `img` with `src` restricted to `/api/attachments/` prefix or
`https:` URLs (implement via a custom `urlTransform` that returns `""` for anything else).

##### Implementation

1. New component `src/components/Markdown.tsx`:
   ```tsx
   export function Markdown({ children }: { children: string }) // renders sanitized GFM
   ```
   Styles: `prose prose-sm max-w-none` look-alike using Tailwind (match existing text styles;
   code blocks reuse `CodeBlock.tsx` styling if trivial, else plain `<pre>`).
2. New component `src/components/MarkdownEditor.tsx` (`"use client"`):
   - A `<textarea>` with a tab bar `Write | Preview` (Preview renders `<Markdown>`).
   - Toolbar buttons: bold, italic, code, list, link (simple `textarea` selection wrapping).
   - `onPaste` with image in clipboard → upload via F-01 endpoint (needs props
     `projectId`, `entityType`, `entityId`) → insert `![filename](/api/attachments/<id>)` at cursor.
   - Props: `{ name, defaultValue, projectId?, entityType?, entityId?, rows? }` — it must work
     as a drop-in replacement for the current `<textarea name=...>` inside existing forms
     (uncontrolled, submits with `FormData`).
3. Replace textareas in `CaseForm.tsx` (description, preconditions, per-step action/expected —
   steps may keep single-line inputs but must render Markdown in read views) and the comment box
   in `RunExecutor.tsx`.
4. Replace read-side plain-text rendering on: case detail page, run executor case panel,
   run result comments, milestone/plan descriptions (when they exist).

##### Acceptance criteria

1. `**bold**`, tables, task lists, fenced code render correctly on the case detail page.
2. `<script>alert(1)</script>` in a description renders as inert text (sanitized), never executes.
3. Pasting a screenshot into the description editor uploads it and inserts a working image ref;
   the image renders on the case detail page.
4. Existing plain-text cases render unchanged (plain text is valid Markdown).
5. An image ref `![x](javascript:alert(1))` renders with empty/blocked src.

##### Test plan

e2e `e2e/markdown.spec.ts`: create case with GFM + XSS payload → assert rendered `<strong>`
exists and no dialog opened; screenshot-paste covered by a direct API insert + render assert.

---

#### F-03 — Custom fields `[x]`

> **Status: DONE** (2026-07-09, branch `feat/custom-fields`), with these notes:
> - All 9 types shipped (TEXT/TEXTAREA/NUMBER/CHECKBOX/DATE/URL/USER/DROPDOWN/MULTISELECT);
>   one shared validator (`src/lib/custom-fields.ts`) serves forms, API, and CSV import.
>   Keys **and types** are immutable after creation (stored values are keyed/typed by them).
> - Fields tab (`/projects/[slug]/fields`) manages defs — project OWNER/ADMIN or org ADMIN;
>   inactive defs disappear from forms/CSV export but stored values keep rendering
>   (case detail marks them "(disabled)") and survive edits via `mergeCustomJson`.
> - Wired: case form (create+edit), case detail panel, run executor submit panel
>   (RESULT defs; invalid side-field values fail safe — the P/F submit still lands,
>   custom left unchanged, to keep the rapid-fire keyboard flow unblocked),
>   CSV export (`cf_<key>` per active def) and import (parses `cf_*`, per-row errors
>   in the existing preview), API v1 (`custom` on Case/Result, 422 with
>   `custom.<key>` details, `GET/POST /fields`, `PATCH /fields/[id]`, OpenAPI).
> - **Deferred**: CasesTable optional columns + filter chips for custom fields
>   (spec item 4) — the table is already dense; revisit alongside a column-picker.

**Goal.** Project admins define extra fields on test cases and run results; fields appear in
forms, tables, filters, CSV, and API. TestRail's #1 stickiness feature.

##### Data model

```prisma
model CustomFieldDef {
  id          String  @id @default(cuid())
  projectId   String
  entity      String  // "CASE" | "RESULT"
  key         String  // machine key: ^[a-z][a-z0-9_]{1,30}$, unique per project+entity
  label       String
  type        String  // TEXT | TEXTAREA | NUMBER | CHECKBOX | DATE | URL | USER | DROPDOWN | MULTISELECT
  optionsJson String  @default("[]") // string[] for DROPDOWN/MULTISELECT
  required    Boolean @default(false)
  order       Int     @default(0)
  active      Boolean @default(true) // soft-disable, never hard-delete a def with data

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([projectId, entity, key])
}
```

Values live **on the entity** (no join table — simpler and fast enough at this scale):
add `customJson String @default("{}")` to both `TestCase` and `TestRunResult`.
Shape: `{ [key]: value }` where value is `string | number | boolean | string[]` per type
(`DATE` = `"YYYY-MM-DD"`, `USER` = userId).

##### Validation — new file `src/lib/custom-fields.ts`

```ts
export function validateCustomValues(defs: CustomFieldDef[], input: Record<string, unknown>):
  { ok: true; json: string } | { ok: false; errors: { field: string; message: string }[] }
```
Rules: unknown keys rejected; required + active must be present and non-empty; type coercion
(`NUMBER` finite, `CHECKBOX` boolean, `DROPDOWN` value ∈ options, `MULTISELECT` ⊆ options,
`URL` must parse with http/https, `USER` must be a project member id). Inactive defs: values
preserved but not editable/required.

##### Wiring (each is a small, mechanical change)

1. **Settings UI**: new tab "Fields" on the project page (follow `ProjectTabs.tsx` pattern) →
   `src/components/CustomFieldsManager.tsx`: list, create, edit, reorder (up/down buttons are
   enough), toggle active. OWNER/ADMIN of the project only. Actions in
   `src/app/actions/custom-fields.ts` (audit: `field.create|update|disable`).
2. **CaseForm.tsx**: render active CASE defs in order below the standard fields; submit as
   `custom_<key>` FormData entries; `readCaseFields` in `actions/cases.ts` collects them and
   calls `validateCustomValues`.
3. **RunExecutor.tsx**: render active RESULT defs in the result panel; saved with the result.
4. **CasesTable.tsx**: columns menu gains custom fields (off by default); values render by type
   (checkbox → ✓/–, user → name, multiselect → chips). Filterable via existing filter bar for
   DROPDOWN/MULTISELECT/CHECKBOX types.
5. **CSV**: export adds one column per active CASE def, header `cf_<key>`; import recognizes
   `cf_*` headers, validates per def, reports per-row errors in the existing preview step.
6. **API v1**: `serializeCase`/`serializeResult` gain `custom: {...}` (parsed). Case create/
   update endpoints accept `custom` object → `validateCustomValues` → 422 with `details` on
   failure. New endpoints `GET/POST /api/v1/projects/[slug]/fields`,
   `PATCH /api/v1/projects/[slug]/fields/[id]`.

##### Acceptance criteria

1. Admin creates required DROPDOWN "Component" [api, web, mobile]; creating a case without it
   fails with a field error; with `Component=web` succeeds and shows in table + CSV export as `cf_component`.
2. API `POST .../cases` with `custom: { component: "desktop" }` → 422 with
   `details: [{ field: "custom.component", ... }]`.
3. Disabling a def hides it from forms but old values still render on existing cases.
4. Defs are project-scoped: another project neither sees nor validates them.
5. VIEWER cannot open the Fields tab actions (server-side rejected too).

##### Test plan

e2e `e2e/custom-fields.spec.ts`: admin creates field → case form shows it → required validation
→ value visible in detail + table → CSV export contains header/value.

---

#### F-04 — Shared steps `[x]`

> **Status: DONE** (2026-07-10, branch `feat/shared-steps`), with these notes:
> - `TestStep` became the union `InlineStep | {shared: <groupId>}` — old data is inline-only,
>   so it's backward-compatible with zero migration. Expansion (`src/lib/steps.ts`) runs in
>   every consumer: case detail, run executor, CSV export (marker `[shared: <title>]`,
>   re-import yields inline copies), and API (`stepsExpanded` alongside raw `steps` on GET).
> - Library page at `/projects/[slug]/cases/shared-steps` (linked from the cases sidebar);
>   groups show live usage counts (LIKE scan on stepsJson, fine at this scale).
> - CaseForm renders a reference as a read-only indigo block with move / **unlink → copy
>   inline** / remove; "⛓ Insert shared steps…" picker appends a reference. Clone keeps refs.
> - Deletion blocked while referenced (UI error + API **409** listing up to 5 display ids);
>   deviation from spec: **hard delete** when unreferenced instead of a deletedAt column —
>   a soft-deleted group would still be a dangling ref, which we render as a visible
>   "⚠ missing shared steps" placeholder anyway.
> - Deviation: F-05 revision snapshots don't exist yet — the "snapshots store expanded
>   copies" requirement moves to F-05 itself.

**Goal.** Reusable step groups (e.g. "Login as admin") referenced by many cases; edit once,
updated everywhere. Parity with TestRail/Qase.

##### Data model

```prisma
model SharedStepGroup {
  id        String    @id @default(cuid())
  projectId String
  title     String
  stepsJson String    @default("[]") // TestStep[] = [{action, expected}]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime? // soft delete; only allowed when refCount = 0

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

**Step format change** in `src/lib/constants.ts`: a case's `stepsJson` array items become a union:

```ts
export type TestStep =
  | { action: string; expected: string }          // existing inline step (unchanged shape!)
  | { shared: string /* SharedStepGroup id */ };  // reference item
```

Backward compatibility is automatic: old data contains only inline items.

##### Expansion helper — add to `src/lib/constants.ts` (or new `src/lib/steps.ts`)

```ts
// Replaces {shared} items with the group's inline steps, flagging their origin.
export function expandSteps(steps: TestStep[], groups: Map<string, {title: string; steps: {action:string;expected:string}[]}>):
  { action: string; expected: string; fromShared?: { id: string; title: string } }[]
```

Every consumer of steps must expand: case detail view, `RunExecutor.tsx`, CSV export
(exported rows contain the **expanded** steps; a `#shared:<title>` marker prefix in the action
cell is acceptable), JUnit/report views, F-05 revision snapshots (**store expanded copy** in
snapshots so history is immutable), API `serializeCase` (returns both `steps` raw and
`stepsExpanded`).

##### Behavior rules

- Deleting a group that is referenced by ≥1 non-deleted case is **blocked** with a message
  listing up to 5 case display IDs (`caseDisplayId`) + count.
- Editing a group affects all referencing cases immediately (this is the point).
- Cloning a case keeps the reference (not a copy).
- Usage count = number of non-deleted cases whose `stepsJson` contains `"shared":"<id>"`
  (SQLite `LIKE '%"shared":"<id>"%'` is acceptable at this scale).

##### UI

1. New page `src/app/(app)/projects/[slug]/cases/shared-steps/page.tsx`: table of groups
   (title, step count, usage count, updated) + create/edit form reusing the step editor UI from
   `CaseForm.tsx` (extract it to `src/components/StepsEditor.tsx` if not already reusable).
2. In `CaseForm.tsx` steps editor: an "Insert shared steps" button → dropdown of groups →
   inserts a reference row rendered as a colored block (group title + preview of its steps,
   read-only, with an "unlink → copy inline" button and remove button).
3. In `RunExecutor.tsx`: expanded steps show a small badge with the group title.

Actions: `src/app/actions/shared-steps.ts` (`create/update/delete`), audit `sharedsteps.*`.
API: `GET/POST /api/v1/projects/[slug]/shared-steps`, `PATCH/DELETE .../shared-steps/[id]`
(DELETE → 409 `conflict` when referenced).

##### Acceptance criteria

1. Create group "Login" with 3 steps; insert into 2 cases; run executor shows 3 expanded steps
   with badge in both.
2. Edit group → both cases show the new text without touching the cases.
3. Deleting the group is blocked with case IDs listed; after removing refs, delete succeeds.
4. CSV export of a case with a shared ref contains the expanded steps.
5. Old cases (inline-only) behave exactly as before.

##### Test plan

e2e `e2e/shared-steps.spec.ts` covering AC 1–3.

---

#### F-05 — Test case history & versioning `[x]`

> **Status: DONE** (2026-07-10, branch `feat/case-history`). Implemented as specified, with
> these deliberate deviations:
> - No revision backfill: legacy cases get their baseline revision ("created") on their
>   first post-F-05 edit, so that first edit shows no field diff — history starts there.
> - Restore flattens shared-step references into inline steps (snapshots store the
>   expanded form by design, so the reference is no longer known at restore time).
> - "Restore from trash" write point skipped — that flow doesn't exist yet (soft-deleted
>   cases are purged, never restored).
> - Bonus: `caseRev` is also stamped by the JUnit upload and the run-results upsert API,
>   `rev`/`caseRev` are exposed in `serializeCase`/`serializeResult`, and the run CSV
>   export gained a `case_rev` column.

**Goal.** Every change to a case is recorded as a numbered revision with author, timestamp and
diff; any revision can be restored; run results remember which revision they executed.
TestLink-grade traceability with modern UX.

##### Data model

```prisma
model TestCaseRevision {
  id            String   @id @default(cuid())
  caseId        String
  rev           Int      // 1,2,3… per case
  authorId      String?
  snapshotJson  String   // full serialized case fields at that moment (see below)
  changeSummary String   // e.g. "title, steps" — comma list of changed field names
  createdAt     DateTime @default(now())

  testCase TestCase @relation(fields: [caseId], references: [id], onDelete: Cascade)
  author   User?    @relation(fields: [authorId], references: [id])
  @@unique([caseId, rev])
}
```

Add to `TestCase`: `rev Int @default(1)`. Add to `TestRunResult`: `caseRev Int?`.

**Snapshot shape** (documented in code next to the writer): JSON object with `title,
description, preconditions, steps (EXPANDED via F-04), expectedResult, priority, type, status,
automationStatus, tags, suiteId, assigneeId, linkedIssues, custom` — i.e., everything a human
would diff. Snapshots are immutable.

##### Write points (all in `src/app/actions/cases.ts` + API case create/update + CSV import)

Create a single helper `src/lib/case-revisions.ts`:

```ts
export async function recordRevision(caseId: string, authorId: string | null): Promise<void>
// loads current case, computes changed fields vs latest revision snapshot,
// skips write when nothing changed, else increments case.rev and inserts revision.
```

Call after **every** case create (rev 1, summary "created"), update, restore-from-trash,
bulk edit (one revision per affected case), CSV import update, API update. When a run is
created, copy each case's current `rev` into `TestRunResult.caseRev`.

##### UI

- Case detail page gets tabs `Details | History`. History tab
  (`src/components/CaseHistory.tsx`): list of revisions (rev #, author, time, changeSummary);
  clicking one shows a **field-by-field diff vs the previous revision**: unchanged fields
  collapsed, changed fields shown old→new; steps diff = per-index compare, added rows green,
  removed red (plain rendering, no diff library needed — compare arrays index-wise plus
  length delta).
- "Restore this revision" button (MEMBER+): writes snapshot fields back onto the case and
  records a **new** revision with summary `restored from rev N`. Never deletes history.
- Run views: result rows show `rev N` chip when `caseRev` < current case rev (tooltip:
  "Case has changed since this run").

API: `GET /api/v1/projects/[slug]/cases/[caseId]/revisions` (list, newest first, cursor).
Audit: `case.restore_revision`.

##### Acceptance criteria

1. Editing title then steps produces rev 2 ("title") and rev 3 ("steps"); History shows correct diffs.
2. No-op save (submit without changes) does not create a revision.
3. Restore rev 1 → case matches rev 1 fields, history now has rev 4 `restored from rev 1`.
4. A run created at rev 2 keeps `caseRev = 2`; after case edits, the run row shows the stale-rev chip.
5. Bulk-editing priority on 10 cases creates exactly 10 revisions.

##### Test plan

e2e `e2e/case-history.spec.ts` for AC 1–3.

---

#### F-06 — Test plans & configurations `[x]`

> **Status: DONE** (2026-07-10, branch `feat/test-plans`). Implemented as specified, with
> these deliberate deviations:
> - The case picker was extracted into `src/components/CaseSelector.tsx` (controlled — the
>   parent form owns the selection) and `NewRunForm` was refactored onto it, exactly as the
>   spec's "extract if needed" allowed.
> - Groups with zero selected options simply don't participate as an axis (documented in
>   `buildCombinations`); zero groups → one run with `configJson = null`.
> - Plan creation emits ONE `plan.created` webhook carrying the child runs instead of N×
>   `run.created` — a batch birth as N events would just be noise. Complete-plan emits
>   `run.completed` per newly-closed child (external systems track runs) but only one
>   human-facing `plan.completed` notification.
> - A "Plans" tab was added to `ProjectTabs` (the spec named pages but no navigation).
> - Config management lives on the Fields page as a "Configurations" section, per spec;
>   deletion is allowed while in use because runs copy option NAMES into `configJson`
>   (commented on the schema).
> - `plan.created`/`plan.completed` were added to WEBHOOK_EVENTS; existing notification-
>   channel e2e unchecks them to stay subscribed to `run.completed` only.
> - F-05 interplay: every generated result is stamped with the case's current `caseRev`.

**Goal.** A Test Plan bundles multiple runs generated from a case selection × a configuration
matrix (e.g. Browser {Chrome, Firefox} × OS {Windows, macOS} → 4 runs), with aggregate
progress. TestRail's flagship feature; Qase has a lighter version.

##### Data model

```prisma
model ConfigGroup {
  id        String   @id @default(cuid())
  projectId String
  name      String   // "Browser"
  order     Int      @default(0)
  project Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  options ConfigOption[]
  @@unique([projectId, name])
}

model ConfigOption {
  id      String @id @default(cuid())
  groupId String
  name    String // "Chrome"
  order   Int    @default(0)
  group ConfigGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  @@unique([groupId, name])
}

model TestPlan {
  id          String    @id @default(cuid())
  projectId   String
  name        String
  description String?
  status      String    @default("ACTIVE") // ACTIVE | COMPLETED
  milestoneId String?
  createdById String
  createdAt   DateTime  @default(now())
  completedAt DateTime?
  project   Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  milestone Milestone? @relation(fields: [milestoneId], references: [id])
  createdBy User       @relation("PlanCreator", fields: [createdById], references: [id])
  runs      TestRun[]
}
```

Add to `TestRun`: `planId String?` (+ relation) and `configJson String?`
(e.g. `{"Browser":"Chrome","OS":"Windows"}`; `null` for standalone runs — **all existing
run behavior must keep working for standalone runs**).

##### Creation flow

New page `projects/[slug]/plans/new`:
1. Name/description/milestone.
2. Case selection — **reuse the exact same picker as `NewRunForm.tsx`** (filter + select-all;
   extract to a shared component `src/components/CaseSelector.tsx` if needed).
3. Configuration matrix: checkboxes per ConfigGroup's options. Cartesian product preview:
   "Will create 4 runs: Chrome/Windows, Chrome/macOS, …". Zero groups selected → creates 1
   run with `configJson = null`.
4. Submit (`src/app/actions/plans.ts` → `createPlan`): creates the plan + one `TestRun` per
   combination, each named `"<plan name> — <opt1> / <opt2>"`, each seeded with UNTESTED
   results for the selected cases (same as run creation today). Cap: reject > 50 combinations
   with a form error.

##### Plan pages

- `projects/[slug]/plans` — list with per-plan aggregate progress bar (sum of all child-run
  result statuses, same color coding as runs list).
- `projects/[slug]/plans/[planId]` — plan header + table of child runs (config chips, per-run
  progress, link to executor) + a **matrix view**: rows = config combo, columns = passed /
  failed / blocked / untested counts. "Complete plan" button completes all child runs
  (confirmation required; already-completed runs untouched).

Config management UI: "Configurations" section on the project settings/fields page
(groups + options CRUD, OWNER/ADMIN; deleting an option used by an existing run's `configJson`
is allowed — runs keep the copied name because `configJson` stores strings, not FK ids;
this denormalization is deliberate and must be commented in the schema).

API: `GET/POST /api/v1/projects/[slug]/plans`, `GET .../plans/[planId]` (includes child runs
with stats), `GET/POST .../config-groups`. `serializeRun` gains `planId` and `config`.
Webhooks: `plan.created`, `plan.completed`. Audit: `plan.create|complete`.
Reports page: when runs share a `planId`, the trend chart tooltip shows config names.

##### Acceptance criteria

1. Plan with 2×2 config selection creates exactly 4 runs, each seeded with the selected cases,
   each named with its combo, plan page shows 4 rows + aggregate bar.
2. Executing results in child runs updates the plan aggregate live (on refresh).
3. Plan with no configs creates 1 run; standalone runs (no plan) work exactly as before.
4. 51+ combinations rejected with a clear form error.
5. Complete-plan completes all child runs and sets `completedAt`.

##### Test plan

e2e `e2e/plans.spec.ts` for AC 1, 3, 5.

---

#### F-07 — Issue tracker integration: Jira, GitHub, GitLab `[x]`

> **Status: DONE** (2026-07-10, branch `feat/issue-integrations`). Implemented as specified,
> with these deliberate deviations:
> - `lib/crypto.ts` already existed — it was built during F-08 for encrypted webhook URLs and
>   is reused verbatim here for `authEnc`.
> - **The spec's test plan was wrong.** Provider calls happen in server actions, so Playwright
>   `route()` (a *browser*-side intercept) can never see them. `e2e/integrations.spec.ts`
>   instead runs a real local HTTP mock of the GitHub API and points the integration's
>   `baseUrl` at it. That required a new env, `TF_ALLOW_INSECURE_INTEGRATION_URL=1`, to permit
>   an `http://` base — which is also a genuine need for self-hosters running internal
>   GitLab/Jira on a trusted network. https remains mandatory by default.
> - A connection is verified against the live provider **before** the row is written, so a bad
>   token can never be persisted as active (AC 2 holds at the storage layer, not just the UI).
> - `defectUrl` is still set alongside the `IssueLink` so existing reports keep working.
> - Sync cron stamps `syncedAt` even when a refresh fails, so one broken link (deleted issue,
>   revoked token) can't monopolise every subsequent batch.
> - The model is named `Integration` (spec) — one row per project+provider, enforced by a
>   unique constraint; deleting it leaves `IssueLink` rows readable.
> - Webhook/notification event `issue.created` fires on both the UI and API link paths.
> - No seed data: a demo `Integration` would carry a fake token pointing at a host that does
>   not exist, so "Test connection" would fail on a fresh install and the sync cron would
>   burn its batch on it. The Integrations tab explains itself when empty.

**Goal.** Replace URL-string linking with real integration: create an issue from a failed
result with one click (pre-filled repro), link issues both ways, and show live issue status.

##### Data model

```prisma
model Integration {
  id         String   @id @default(cuid())
  projectId  String
  provider   String   // "JIRA" | "GITHUB" | "GITLAB"
  baseUrl    String   // Jira site url / api base; github.com default for GITHUB
  targetKey  String   // Jira project key ("QA") | "owner/repo" | gitlab project path
  authEnc    String   // AES-256-GCM encrypted JSON: {email, apiToken} | {token}
  active     Boolean  @default(true)
  createdAt  DateTime @default(now())
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([projectId, provider])
}

model IssueLink {
  id         String   @id @default(cuid())
  projectId  String
  provider   String
  issueKey   String   // "QA-123" | "#42"
  issueUrl   String
  title      String?
  status     String?  // last synced status text
  syncedAt   DateTime?
  entityType String   // "CASE" | "RESULT"
  entityId   String
  createdAt  DateTime @default(now())
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@index([entityType, entityId])
}
```

##### Secret encryption — new file `src/lib/crypto.ts`

AES-256-GCM `encrypt(plaintext): string` / `decrypt(payload): string` using key derived
(scrypt) from `process.env.TF_SECRET` (already-existing app secret if present; otherwise add
`TF_SECRET` env with dev default and a startup console warning when defaulted). Output format
`v1:<iv b64>:<tag b64>:<cipher b64>`. **Never log decrypted tokens; never return `authEnc`
or decrypted values from any API/serializer.**

##### Provider clients — new file `src/lib/issue-providers.ts`

One interface, three tiny implementations (plain `fetch`, no SDK deps):

```ts
export interface IssueProvider {
  createIssue(i: { title: string; body: string }): Promise<{ key: string; url: string }>;
  getIssue(key: string): Promise<{ title: string; status: string; url: string }>;
  testConnection(): Promise<void>; // throws with readable message
}
```

- Jira Cloud: `POST {baseUrl}/rest/api/3/issue` (basic auth email:apiToken; body as ADF from
  plain text paragraphs), `GET .../issue/{key}?fields=summary,status`.
- GitHub: `POST https://api.github.com/repos/{targetKey}/issues` (token), `GET .../issues/{n}`.
- GitLab: `POST {baseUrl}/api/v4/projects/{urlencoded path}/issues`, `GET` same.
- All calls: 10 s timeout, surface provider error text in thrown message (truncate 300 chars).

##### Flows

1. **Settings** — project "Integrations" tab (`src/components/IntegrationsManager.tsx`):
   configure per provider (form fields per provider type), "Test connection" button
   (calls `testConnection` via server action, shows ✓/error), OWNER/ADMIN only.
   Audit: `integration.create|update|delete` (detail = provider, never the token).
2. **Create issue from failed result** — in `RunExecutor.tsx`, when a result is FAILED and an
   integration is active: "Create issue" button → modal previewing generated title
   `[<displayId>] <case title> failed in <run name>` and body (Markdown: steps expanded with
   expected vs actual = result comment, environment/config line, link back to the TestForge
   run URL) → server action `createIssueFromResult` calls provider, stores `IssueLink`
   (entityType RESULT) **and** sets `result.defectUrl` (keeps old reports working).
3. **Link existing issue** — on case detail and result rows: "Link issue" input accepting a
   key (`QA-123`, `#42`) or full URL; validates via `getIssue`; stores IssueLink.
4. **Status sync** — new cron route `src/app/api/cron/sync-issues/route.ts` (same auth
   pattern as existing purge cron): refresh `status` for links `syncedAt` older than 15 min,
   max 50 per invocation, sequential with 200 ms gap (rate-limit friendliness). UI badge
   colors: green when status ∈ {Done, Closed, Resolved} (case-insensitive), else amber.

API: `GET /api/v1/projects/[slug]/issues?entityType=&entityId=` (list links),
`POST` (link by key), `DELETE .../issues/[id]`. Webhook event: `issue.created`.

##### Acceptance criteria

1. Configured GitHub integration + failed result → Create issue → real issue exists with steps
   in body and backlink; result shows `#42` badge; `defectUrl` filled.
2. Wrong token → "Test connection" shows the provider's error; nothing saved as active.
3. Issue status changes upstream → after sync cron, badge updates.
4. `authEnc` never appears in any API response, page HTML, or audit detail (grep-level check).
5. Projects without integrations show the old plain-URL fields unchanged.

##### Test plan

Unit-style e2e against a mock: add a tiny mock provider route under `e2e/` fixtures (Playwright
`route()` interception of `api.github.com`) exercising flow 2 end-to-end. Encryption
round-trip test for `crypto.ts` (can be a Playwright API test hitting a debug-only action, or
a plain node script under `scripts/`).

---

#### F-08 — Notifications: Slack, Discord, Teams, email `[x]`

> **Status: DONE** (2026-07-10, branch `feat/notifications`). Implemented as specified, with
> these deliberate deviations:
> - `milestone.completed` is registered in the event vocabulary but has no producer yet —
>   the app has no milestone-completion flow (expected with F-06 test plans).
> - The JUnit upload emits only `run.completed` (the run is born completed; a separate
>   `run.created` for the same instant would be noise). `result.failed` fires from the
>   interactive executor and the results API, not from bulk JUnit ingestion — the
>   run.completed summary already carries the failure count.
> - Formatter unit checks live at the top of `e2e/notifications.spec.ts` (node-side
>   assertions on the pure functions) instead of a separate `scripts/` file — same
>   coverage, runs with the suite.
> - `lib/crypto.ts` (spec'd under F-07) was built now for the encrypted webhook URLs;
>   key falls back TF_SECRET → AUTH_SECRET → dev default with a console warning.
> - Bonus: existing `case.created/updated/deleted` webhook sites also notify, and the
>   playwright webServer sets `TF_ALLOW_ANY_WEBHOOK_HOST=1` so e2e can target a local
>   receiver.

**Goal.** Push run/case events to team chat and email. Builds directly on the existing webhook
dispatcher.

##### Data model

```prisma
model NotificationChannel {
  id        String   @id @default(cuid())
  projectId String
  type      String   // "SLACK" | "DISCORD" | "TEAMS" | "EMAIL"
  name      String   // display label, e.g. "#qa-alerts"
  configJson String  // SLACK/DISCORD/TEAMS: {webhookUrl} (encrypted via F-07 crypto) | EMAIL: {to: string[]}
  events    String   // comma-separated, same vocabulary as WEBHOOK_EVENTS + new ones below
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

Extend `WEBHOOK_EVENTS` (F-08 also benefits external webhooks): add `"run.created"`,
`"result.failed"`, `"case.assigned"`, `"milestone.completed"`.

##### Dispatcher — new file `src/lib/notifications.ts`

```ts
export async function notify(projectId: string, event: WebhookEvent, data: NotifyData): Promise<void>
```

Called from the exact same places as `dispatchWebhook` (search all call sites; add the new
event emit points: run creation action, result save when status becomes FAILED, case assignee
change, milestone completion). Fire-and-forget like webhooks, 5 s timeout, swallow errors
(but `console.warn` with channel id).

Formatters (pure functions, unit-testable):
- Slack: `{ text, blocks: [...] }` — header line with emoji by event (✅/❌/🏁), fields
  (project, run/case name with absolute URL from `process.env.TF_BASE_URL ?? "http://localhost:3000"`),
  posted to the stored incoming-webhook URL.
- Discord: `{ embeds: [{ title, url, color, fields }] }` (color: red failures, green completions).
- Teams: Adaptive Card via incoming webhook (`{"type":"message","attachments":[…]}`).
- Email: reuse `src/lib/mailer.ts`; subject `[TestForge] <event>: <name>`; simple HTML table body.

**`result.failed` noise control:** per channel+run, at most 1 message per minute; further
failures in that window are aggregated into the next message as "…and N more failures"
(in-memory map keyed `channelId:runId` is acceptable; document that multi-instance deploys
may occasionally double-send).

##### UI

Project settings → "Notifications" tab: `src/components/NotificationChannelsManager.tsx` —
list/create/edit/toggle channels, event checkboxes, "Send test message" button.
OWNER/ADMIN only. Audit: `notification.create|update|delete|test`.

##### Acceptance criteria

1. Slack channel subscribed to `run.completed` receives a formatted block message with a
   working link when a run completes; unsubscribed events send nothing.
2. 20 rapid failures in one run produce ≤ ~2 Slack messages (aggregation works).
3. "Send test message" delivers to the configured target and reports success/failure inline.
4. Email channel sends via existing mailer; malformed webhook URL fails channel save with a
   form error (must be https and host-matched per type: `hooks.slack.com`,
   `discord.com`/`discordapp.com`, `*.webhook.office.com`; document override env
   `TF_ALLOW_ANY_WEBHOOK_HOST=1` for self-hosters with proxies).
5. A dead webhook URL never delays or fails the originating user action.

##### Test plan

e2e with Playwright `route()` intercepting the Slack URL: create channel → complete run →
assert intercepted payload shape. Formatter unit checks via a script in `scripts/`.

---

#### F-09 — Global search (⌘K command palette) `[x]`

> **Status: DONE** (2026-07-09, branch `feat/global-search`). Implemented as specified,
> with these notes:
> - Built with zero new dependencies (no `cmdk`) — hand-rolled modal + keyboard handling.
> - Trigger button lives in the sidebar (the app has no top header); ⌘K/Ctrl+K works from
>   every app page via the layout mount.
> - Exact display-id lookup accepts both padded (`TC-E2E-002`) and unpadded (`TC-E2E-2`)
>   forms and ranks the match first.
> - Milestone results link to the project's runs page (no dedicated milestone page exists yet).
> - Tenant isolation is e2e-tested: a fixture project owned by another user
>   (`private-e2e` in `global-setup.ts`) never appears in results (`search.spec.ts`).

**Goal.** One keystroke, search everything you can access: cases, runs, suites, milestones,
plans. Faster than TestRail's search, matching Qase.

##### Endpoint — `src/app/api/search/route.ts` (internal, session-only)

`GET /api/search?q=<term>&project=<slug optional>` →
```json
{ "cases": [{id, displayId, title, projectSlug}], "runs": [...], "suites": [...], "milestones": [...] }
```
Rules: min 2 chars (else empty result), max 10 per group, **scope = projects where the user is
a member** (single `WHERE project.members.some({userId})` on every query — this is the
security boundary, test it), SQLite `contains` (LIKE) on: case title/description + exact
`displayId` match (parse `TC-<slug>-<num>` → seq lookup), run name, suite name, milestone
name. Soft-deleted cases excluded. Order: displayId exact match first, then `updatedAt` desc.

##### UI — `src/components/CommandPalette.tsx` (`"use client"`, no new deps)

- Global keydown listener: `⌘K` / `Ctrl+K` opens; `Esc` closes; mounted once in the app layout
  `src/app/(app)/layout.tsx`.
- Modal: input (auto-focus, 200 ms debounce) → grouped results with icons; `↑/↓` +
  `Enter` navigation; result click → `router.push` to the entity page; footer hint row.
- Recent selections in `localStorage` (`tf_recent_search`, max 5) shown when input is empty.
- Also add a search button in the app header so the feature is discoverable without the shortcut.

##### Acceptance criteria

1. `⌘K` → typing a case title fragment shows the case within ~300 ms; Enter navigates to it.
2. Typing an exact display ID (`TC-WEB-001`) shows that case first.
3. A user who is not a member of project X never sees X's entities in results (verified by test).
4. 1-char input shows hint, no request fired.
5. Works from every app page (layout-mounted).

##### Test plan

e2e `e2e/search.spec.ts`: AC 1–3 (create second user for AC 3 via seed).

---

#### F-10 — Saved filters / views `[x]`

> **Status: DONE for CASES** (2026-07-09, branch `feat/saved-views`). Deviations/notes:
> - Schema keeps `userId` as the owner on every view plus a `shared Boolean`, instead of
>   the spec's nullable-userId-means-shared — ownership survives sharing, which powers the
>   delete rule (owner always; project OWNER/ADMIN or org ADMIN for shared) and the
>   personal default (`isDefault`, max one per user+project+entity, enforced in the action).
> - The cases list was already server-filtered via URL params, so a view is simply a
>   whitelisted snapshot of `{suite, priority, type, q, tag}` (`sanitizeCaseFilters` drops
>   stale keys on save *and* apply); `?v=<id>` marks the active view.
> - Default view auto-applies as a server-side redirect on a param-less visit; `?v=all`
>   ("All cases" pseudo-view) suppresses it. Editing filters manually drops `v` — you're
>   off-view the moment you deviate.
> - VIEWERs may save **personal** views (a view is a UI preference, not test data);
>   sharing requires write access.
> - **RUNS entity deferred**: the `entity` column is ready; the runs list has no filter
>   bar worth saving yet.

**Goal.** Save the current cases/runs table filter combination as a named view; personal or
shared with the project; optional default.

##### Data model

```prisma
model SavedView {
  id         String   @id @default(cuid())
  projectId  String
  userId     String?  // null = shared project view
  entity     String   // "CASES" | "RUNS"
  name       String
  filtersJson String  // opaque to server: the table's filter state object
  isDefault  Boolean  @default(false) // per user+project+entity: max one
  createdAt  DateTime @default(now())
  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

##### Implementation

1. `CasesTable.tsx` (and the runs list filter bar) must first centralize filter state into one
   serializable object `{ search, suiteId, priority[], type[], status[], automationStatus[], tags[], assigneeId, customFields{} }`
   synced to URL query params (shareable URLs come free — do this even if partially present).
2. Views dropdown in the table toolbar: list (personal section + shared section), "Save
   current as view…" (name + shared checkbox [MEMBER+ may share], "make default" checkbox),
   apply on click (replaces URL params), star icon toggles default, delete (own views;
   OWNER/ADMIN may delete shared ones).
3. On table mount with no query params: apply the user's default view if any.
4. Actions `src/app/actions/saved-views.ts`; audit `view.create|delete`. Unknown/stale keys
   inside `filtersJson` (e.g. removed custom field) are ignored silently on apply.

##### Acceptance criteria

1. Filter Priority=CRITICAL + tag=smoke → save as "Critical smoke" → reload → select view →
   same rows and URL params restored.
2. Default view auto-applies on first visit; "All cases" pseudo-view (always present, not in DB)
   clears it.
3. Shared view visible to another member; personal view is not.
4. Deleting a custom field referenced by a view doesn't break applying it.

##### Test plan

e2e `e2e/saved-views.spec.ts`: AC 1–2.

---

### 4. P2 features

Compact work orders — same conventions (§0, §1) apply. Each is still a single PR-sized unit
unless marked (large).

#### F-11 — Additional automation result formats `[x]`

> **Status: DONE** (2026-07-11, branch `feat/result-formats`). Implemented as specified, with
> these deviations:
> - `src/lib/result-parsers/*.ts` export pure parsers only; matching + run creation moved into
>   a new shared `src/lib/result-ingest.ts` (`ingestResults()`) so both `/api/v1/results` and
>   `/api/v1/junit` call the same pipeline instead of `/api/v1/junit` delegating to `/results`.
> - `/api/v1/junit` keeps its original auth (`authenticateApiKey`, bare Bearer key, no WRITE-scope
>   check) and response shape (`runId`, flat `summary`) unchanged — it predates `guard()` and is
>   used daily by prod CI, so behavior was preserved exactly rather than upgraded to §0.3.
>   `/api/v1/results` is new, so it uses the current `guard(req, { write: true })` convention.
> - Ambiguous status mappings (documented in each parser): TRX `NotExecuted`/`Inconclusive`/
>   `Disconnected` → SKIPPED, `Error`/`Timeout`/`Aborted` → FAILED; NUnit3 `Inconclusive` →
>   SKIPPED; Cucumber `undefined`/`ambiguous` steps → FAILED (broken automation, not a skip),
>   `pending` → SKIPPED; Mocha status derived from `err` emptiness + membership in `pending`.
> - e2e: one 2-test fixture per format under `e2e/fixtures/results/` (one pass via `TC-E2E-1`
>   annotation, one fail via exact-title match) plus an auto-detect case and a malformed-upload
>   422 case, `e2e/result-formats.spec.ts`. Full suite 29/29 green.

- New endpoint `POST /api/v1/results?project=<slug>&name=<run name>&format=<fmt>` accepting:
  `junit` (delegate to the existing parser), `trx` (MSTest XML), `nunit3`, `xunit2`,
  `cucumber` (JSON), `mocha` (JSON). Auto-detect when `format` omitted: try JSON parse →
  cucumber/mocha by shape; else XML → root element name (`TestRun`→trx, `test-run`→nunit3,
  `assemblies`→xunit2, `testsuites|testsuite`→junit).
- One parser per format in `src/lib/result-parsers/<fmt>.ts`, all returning the same
  normalized shape `{ tests: { name, classname?, status: "PASSED"|"FAILED"|"SKIPPED", timeSeconds?, message? }[] }`,
  then reuse the existing JUnit matching pipeline (annotation `TC-…` in name, else exact title).
- Keep `/api/v1/junit` as an alias forever (documented). Update OpenAPI + docs page + README.
- AC: one fixture file per format under `e2e/fixtures/results/` uploads successfully and
  produces a run with correctly mapped statuses; malformed file → 422 with row/parse error message.

#### F-12 — Official reporters + CLI (large) `[x]`

> **Status: DONE** (2026-07-13, branch `feat/reporters-cli`). Implemented as specified, with
> these notes:
> - **No server changes**: the cases REST serializer already exposes `displayId`
>   (`TC-<SLUG>-<n>`), so reporters resolve annotations → case ids client-side by paging
>   `GET /api/v1/projects/:slug/cases`, then create a run (`source=<framework>`), stream results
>   to the existing `POST …/runs/:runId/results`, and `PATCH …/runs/:runId` to complete.
> - All JS packages are **plain ESM, zero runtime deps** (Node 18+ `fetch`); frameworks are
>   *optional* peer deps so `npm ci` never pulls Playwright/Cypress into the reporter packages.
>   `tsconfig` excludes `packages/` so the Next app's typecheck/build is untouched (verified).
> - **Cypress** is a `setupNodeEvents` plugin (`before:run`/`after:spec`/`after:run`), **not** a
>   Mocha reporter — Cypress re-instantiates Mocha reporters per spec, which breaks a single
>   streamed run and async network posts; the plugin runs once per `cypress run` in Node.
> - **pytest** plugin uses stdlib `urllib` only (no `requests` dep); registered via the
>   `pytest11` entry point in `pyproject.toml`.
> - The `testforge gate` subcommand is a stub that errors pointing at L-02 (CI quality gates,
>   not yet built) — `upload` is the shipped command.
> - Publishing to npm/PyPI is left as a manual step (not automated in CI), per spec.
> - AC met: verified against a live local TestForge — the shared client (used by both JS
>   reporters) creates a run, streams a `TC-E2E-001`-matched PASSED result, and completes it;
>   the CLI matches a `TC-`-annotated JUnit into a run. e2e `reporters-cli.spec.ts` (both via
>   subprocess, CI-safe); full suite 57/57 on a fresh DB.

- Monorepo folder `packages/` (npm workspaces added to root `package.json`):
  `packages/cli` (`testforge-cli`), `packages/playwright-reporter`, `packages/cypress-reporter`,
  `packages/pytest-testforge` (Python, own subfolder with `pyproject.toml`).
- CLI commands: `testforge upload <file> --project <slug> --name <run> [--format]` (wraps F-11),
  `testforge gate …` (see L-02). Config via env `TESTFORGE_URL`, `TESTFORGE_TOKEN` or flags.
- Reporters: create run at suite start (`POST /api/v1/projects/:slug/runs` with
  `source=<framework>`), stream each test result to the existing results endpoint as it
  finishes, complete run at end. Map framework statuses → TestForge statuses; attach failure
  message (truncate 5000 chars) as result comment; read case ID from test title annotation
  `TC-<SLUG>-<n>` (same convention as JUnit matching).
- Each package: README with copy-paste setup, publishable to npm/PyPI (publishing itself is a
  separate manual step — do not automate in CI yet).
- AC: running the repo's own Playwright e2e with the reporter against a local TestForge
  creates a live-updating run.

#### F-13 — Parameters / datasets `[x]`

> **Status: DONE** (2026-07-12, branch `feat/parameters-datasets`). Implemented close to spec,
> with these deviations:
> - `{{var}}` auto-discovery in `CaseForm` only scans **step action/expected text** (the
>   `steps` state is already tracked reactively); title/description/preconditions/expectedResult
>   are uncontrolled inputs in this form, so wiring live discovery from them would mean
>   converting those fields to controlled — out of scope for a P2 mechanical feature. A "+ Add
>   variable column" button covers the gap (add a column manually for a var used elsewhere).
> - Substitution at execution time (run detail page, building `RunExecutor` props) *does* apply
>   to title/preconditions/expectedResult/steps — not just steps — since that data is already
>   server-side and not tied to form control state.
> - `TestRunResult`'s unique constraint became `@@unique([runId, caseId, datasetName])`; the
>   migration was verified lossless locally (140/140 rows before/after — every existing row has
>   `datasetName = null`, and the old `[runId, caseId]` uniqueness already guaranteed no
>   collisions on the new triple).
> - The `POST /api/v1/projects/[slug]/runs/[runId]/results` upsert-by-case endpoint couldn't use
>   Prisma's generated compound-unique object once `datasetName` (nullable) joined the key —
>   Prisma's `upsert` typing rejects `null` there — so it's now a manual find-then-write
>   (`findFirst` → `update`/`create`) instead of `upsert`. Accepts an optional `datasetName` in
>   the body.
> - `rerunFailed` and the CSV/API run-seeding paths all carry `datasetName` through so a rerun
>   or API-created run preserves which row each result belongs to instead of collapsing rows.
> - Case CSV import/export were left untouched — the spec's CSV requirement was for the **run
>   results** export only (`dataset` column added to `/api/export/run`), which naturally gets
>   one row per dataset row since each row is already its own `TestRunResult`.
> - No revision-history integration (F-05 snapshot shape is unchanged) — dataset edits aren't
>   tracked as case history, consistent with attachments/other side-data being out of that shape.
> - Seed demo: one case ("Login sebagai berbagai role user") with 3 dataset rows (Admin/Member/
>   Viewer) in `prisma/seed.mjs`. e2e `e2e/parameters-datasets.spec.ts` covers 2 dataset rows
>   seeding 2 results, substitution, and the missing-var `⚠{{var}}` marker; full suite 33/33 on
>   a fresh DB.

- Add to `TestCase`: `datasetJson String @default("[]")` — array of rows
  `{ name: string, values: Record<string,string> }`. Steps/description may contain `{{var}}`.
- UI in `CaseForm`: "Parameters" section — table editor (columns = discovered `{{vars}}` in
  the case text + manually added, rows = named datasets).
- Run creation: a case with N dataset rows seeds N results (extend `TestRunResult` with
  `datasetName String?`; unique constraint becomes `@@unique([runId, caseId, datasetName])`
  — **migration note:** SQLite can't alter a unique constraint in place; `db push` will
  rebuild the table, verify seed + existing data survive on a copy first).
- Executor renders substituted text per row (`{{var}}` → value, missing var → highlighted
  `⚠ {{var}}`); reports count each row as a separate executed test.
- CSV export: one row per dataset row with a `dataset` column. AC mirrors the above.

#### F-14 — Custom result statuses & custom roles `[x]`

> **Status: DONE** (2026-07-12, branch `feat/custom-statuses-roles`, Fable 5). Implemented to
> spec with these decisions/deviations:
> - **Statuses**: `ResultStatusDef` per project; the 7 built-ins live as in-memory
>   `DEFAULT_STATUS_DEFS` until the project's first edit **seeds** them as `system: true` rows
>   (no writes on read paths). Key & kind immutable on system rows, label/color editable,
>   system rows can't be deactivated (UNTESTED is the seeded default). Managed on the Fields
>   page. Pure helpers in `lib/result-statuses.ts` (client-safe), DB loaders in
>   `lib/result-status-defs.ts`.
> - **Kind-based aggregation** everywhere (pass rate = kind PASS / executed; failure alerts,
>   rerun-failed, run-completed tallies, flaky detection, plan matrix columns all key off
>   kind). Three key-based rules remain, documented: UNTESTED/IN_PROGRESS are the not-executed
>   bucket (there is no "pending" kind — a custom status is always a recorded outcome), and
>   RETEST stays in the rerun-failed selection. Colors are hex now — bars/badges render inline
>   styles (`badgeStyle` auto-contrasts light colors); `RESULT_COLORS/RESULT_BADGES` stay in
>   constants only as legacy fallbacks.
> - **Executor**: buttons = active defs minus UNTESTED/IN_PROGRESS; shortcut = first letter of
>   the label, conflicts resolved by order (tooltip shows it). A status shortcut **shadows**
>   the J/K list navigation on that letter (statuses win; arrows still navigate).
> - **Roles**: `RoleDef` per organization, managed by org admins on Settings → Team; built-ins
>   are fixed presets (OWNER/ADMIN = all, MEMBER = case.write+run.execute+run.manage,
>   VIEWER = none). `ProjectMember.role` stores the custom role NAME; a deleted RoleDef
>   degrades the member to read-only (deletion is blocked while assigned). `lib/permissions.ts
>   can()/loadPerms()` resolves org ADMIN → all, org VIEWER → none, then preset/RoleDef.
> - **Sweep**: every scattered `role === "VIEWER"` check in server actions replaced with
>   can() at the point the project is known; v1 write routes gained `requirePerm()` (403 with
>   the missing permission named). This **fixes a latent hole**: a project-VIEWER whose org
>   role was MEMBER could previously call case-write server actions (only the org role was
>   checked). Upload endpoint (F-11) = run.manage; legacy `/api/v1/junit` alias untouched.
> - `serializeFieldDef` moved from the fields route to `lib/custom-fields.ts` — the export
>   was invalid in a route file all along, masked by Next's incremental type-check cache.
> - AC verified in e2e `custom-statuses-roles.spec.ts` (2): "Known Issue" NEUTRAL purple →
>   executor button + K shortcut + legend + CSV; role "Executor" (run.execute) → submits
>   results, blocked from case edits in the UI action AND the v1 API (403). Suite 50/50.

#### F-15 — Case review workflow `[x]`

> **Status: DONE** (2026-07-12, branch `feat/case-review`, Opus 4.8). Implemented to spec:
> - `TestCase.status` now `DRAFT | IN_REVIEW | APPROVED | ACTIVE | DEPRECATED`; `ACTIVE` stays the
>   approved-legacy runnable state. New fields `reviewerId / reviewedAt / reviewNote`.
> - `IN_REVIEW` & `APPROVED` are **flow-driven only** — the case form / bulk edit expose a manual
>   subset (`CASE_FORM_STATUSES` = DRAFT/ACTIVE/DEPRECATED); `updateCase` refuses to fabricate a
>   review state on a case that wasn't already there, but lets an in-review case round-trip its
>   status through a content edit. `CASE_STATUSES` (all 5) drives validation/badges/`STATUS_BADGES`.
> - Flow (`src/app/actions/review.ts`): `requestReview` (writer picks a reviewer) → `approveCase`
>   / `requestChanges` (assigned reviewer only). Events `case.review_requested / case.approved /
>   case.changes_requested` added to `WEBHOOK_EVENTS` + notify emoji; `notify()` fires like
>   `case.assigned` (project channels). Each transition calls `recordRevision` with a summary
>   override, so F-05 history shows the DRAFT→IN_REVIEW→APPROVED trail.
> - **Guards** (interpretation): "author" = the review requester, so `reviewer ≠ self`
>   (server-side) — the picker also excludes self. Added a rule the spec implied but didn't state:
>   a **VIEWER can't be a reviewer** (they can't act on cases), enforced server-side and by only
>   offering write-access members in the picker.
> - "Needs my review" filter chip (`?review=mine`, `reviewerId=me & IN_REVIEW`) with a live count
>   badge on the cases page; a small inline status pill on non-ACTIVE case rows.
> - Run creation shows a count **warning** (not a block) when selected cases aren't APPROVED/ACTIVE
>   (`RUNNABLE_CASE_STATUSES`). API v1 case serializer + OpenAPI expose the review fields and the
>   widened status enum.
> - e2e `review.spec.ts` 3/3 (approve loop + author≠reviewer/VIEWER guards + history; request-changes
>   → DRAFT + note; run warning); full suite 48/48. Fixture gained a MEMBER `reviewer@testforge.local`.

#### F-16 — Comments & @mentions `[x]`

> **Status: DONE** (2026-07-12, branch `feat/comments-mentions`, Opus 4.8). Implemented to spec:
> - `Comment` model (`{projectId, entityType CASE|RUN|RESULT, entityId, authorId, bodyMd,
>   createdAt, updatedAt, editedAt, deletedAt}`); soft delete leaves a "This comment was deleted"
>   tombstone. Added an explicit `editedAt` (not in the original field list) to drive the
>   "edited" marker deterministically — a create-then-edit within the same second made a
>   `updatedAt − createdAt` heuristic unreliable.
> - Mentions stored inline as `@[userId]` (the body is the single source of truth for
>   notifications). The composer submits the display text (`@Name`) plus the explicit userIds the
>   author picked from autocomplete; the server encodes `@Name → @[userId]` from that list, so a
>   name that is a substring of another can't be mis-encoded. `GET /api/projects/[slug]/members?q=`
>   (new non-versioned, cookie-auth endpoint) backs the autocomplete. Chips render via a tokenizer
>   + the F-02 sanitized renderer in an inline mode (new `inline` prop on `<Markdown>`), so a
>   mention sits inline between markdown fragments; `.tf-mention` styles the chip.
> - Mentioned members are notified through F-08 (`comment.mentioned` event added to
>   `WEBHOOK_EVENTS` + channels) **and** a personal email fallback (`sendMail` per mentioned user
>   with a deep link). `comment.created` also added for teams that want every-comment pings.
> - Mounted on case detail, run page, and per-result in the executor (self-contained client
>   panel; reads/writes via server actions so it works without navigation inside the executor).
>   VIEWER may comment (the action deliberately omits the VIEWER write-gate); OWNER/ADMIN may
>   delete anyone's. Audit `comment.create|delete`.
> - **Comment attachments** (F-01 `entityType: "COMMENT"`): the type is wired end-to-end
>   (`ATTACHMENT_ENTITY_TYPES`, orphan sweep, delete-on-comment-delete) but the composer does not
>   yet expose an uploader — a new comment has no id to attach to before it exists (a two-phase
>   draft-id flow). Deferred; markdown body + inline-image paste can follow the case-editor
>   pattern later.
> - e2e `comments.spec.ts` 3/3 (lifecycle+XSS-inert, mention chip + notification deep link,
>   VIEWER can comment); full suite 45/45.

#### F-17 — Dashboards, run comparison, PDF & scheduled reports, public share links (large) `[x]`

> **Status: DONE** (2026-07-13, four stacked PRs: `feat/run-comparison` #73 →
> `feat/dashboard-builder` #74 → `feat/share-links` #75 →
> `feat/scheduled-reports` #76). Implemented as specified, with these notes:
> - **Run comparison**: rows keyed by caseId + datasetName (F-13-aware); delta
>   semantics are kind-based (F-14) — regression = PASS kind → FAIL/BLOCKED
>   kind, fixed = the reverse; muted cases (F-21) listed but excluded from the
>   regression/fixed tallies. First checked run on the runs list = baseline A.
> - **Dashboards**: widget metric functions live in `lib/report-data.ts`,
>   mirroring the Reports page math; editing gated on `run.manage`, viewing
>   open to all members. Arrow-button repositioning as allowed for v1.
> - **Share links**: token is `crypto.randomBytes(32).toString("hex")`
>   (64 chars) instead of adding a cuid2 dependency. DASHBOARD entityType is
>   fully wired too (panel on dashboard detail, read-only widget grid on
>   /share with a `noLinks` flag). Revoke is a soft flag (row kept for audit).
> - **Scheduled reports**: `lastSentAt` makes the cron route idempotent per
>   calendar day (safe to poll hourly); WEEKLY_MON fires only on Mondays;
>   window = 1d (DAILY) / 7d (WEEKLY_MON); managed on the Notifications page
>   (project.admin). PDF export (title only mentions it; no split item) was
>   not built — the public share link covers the "hand a report to a
>   stakeholder" need without a headless-browser dependency.

Split into 4 sequential PRs:
1. **Run comparison**: page `runs/compare?a=<id>&b=<id>` — table of cases × (status in A,
   status in B, delta arrow), summary of regressions (PASSED→FAILED) and fixes; entry point
   checkbox "compare" on runs list.
2. **Dashboard builder**: `Dashboard`/`DashboardWidget` models; widget types
   `passRateTrend | statusPie | coverageBar | flakyList | runVelocity | textNote`, each a
   self-contained server component reading existing report queries; grid layout stored as
   `{x,y,w,h}` (CSS grid, drag optional — arrow-button repositioning is acceptable v1).
3. **Public share links**: `ShareLink { id, token (cuid2, 32+ chars), entityType: "RUN"|"DASHBOARD", entityId, expiresAt?, createdById, revokedAt? }`;
   public route `/share/[token]` renders a **read-only, no-auth** run report (status summary,
   per-case table, charts) with a "Powered by TestForge" footer; management UI on the run page
   (create/copy/revoke). Absolutely no mutations reachable from shared pages; no other links
   into the app; noindex meta.
4. **Scheduled email reports**: `ReportSchedule { projectId, cron: "WEEKLY_MON"|"DAILY", recipientsJson, kind: "SUMMARY" }`
   sent by extending the existing cron route pattern; email = KPI table + top failures + link.

#### F-18 — Requirements & traceability matrix `[x]`

> **Status: DONE** (2026-07-13, branch `feat/requirements`). Implemented as specified, with
> these notes:
> - "COVERED" is **derived, never stored** (`lib/requirements.ts derivedStatus`): the status
>   column only records the manual OPEN/OBSOLETE distinction, so coverage can't go stale when a
>   case is deleted/deprecated later.
> - Latest-run-status per case is kind-based (F-14 custom statuses): the newest result whose
>   kind is PASS/FAIL/BLOCKED wins; NEUTRAL-kind results don't count as executed, so a case with
>   only "Known Issue" outcomes still shows Untested.
> - Matrix drill-down = requirement link on each row (per-requirement page lists the linked
>   cases with their buckets); CSV export at `/api/export/requirements-matrix?project=<slug>`
>   (session or API-key auth, same pattern as the other export routes).
> - CSV import is a paste-textarea (header `refId,title,description,sourceUrl`, title required,
>   blank refId auto-numbers `REQ-NNN`, duplicate refIds skipped silently).
> - **Deferred**: the reverse link picker on the *case detail* page — linking is fully managed
>   from the requirement detail page (both directions of the M:N), the case-detail affordance is
>   an additive UI nicety.
> - Editing gated on `case.write` (requirements are authored like cases); e2e
>   `requirements.spec.ts` covers create → link → COVERED → PASSED result → matrix Pass bucket →
>   CSV export & import. Full suite 55/55 on a fresh DB.

- `Requirement { id, projectId, refId ("REQ-001" auto or external key), title, descriptionMd, sourceUrl?, status: "OPEN"|"COVERED"|"OBSOLETE", createdAt }` +
  M:N `RequirementCase { requirementId, caseId }`.
- CSV import for requirements (columns: refId, title, description, sourceUrl); link picker on
  case detail; requirement page lists linked cases with their **latest run status**.
- Traceability matrix page `projects/[slug]/requirements/matrix`: rows = requirements,
  columns = latest-result buckets (Pass/Fail/Blocked/Untested/No cases) with counts + drill-down;
  export as CSV. "COVERED" auto-derives: ≥1 linked, non-deleted, non-deprecated case.
- This fills TestLink's niche that modern SaaS tools skip — key differentiator for regulated teams.

#### F-19 — Environments `[x]`

> **Status: DONE** (2026-07-12, branch `feat/environments`). Implemented as specified, with
> these notes:
> - `Environment` uses a real FK (`TestRun.environmentId`) rather than F-06's name-copy pattern
>   — the spec's shape doesn't ask for denormalization, so `onDelete: SetNull` just clears the
>   tag on old runs when an environment is deleted, no dangling-reference rendering needed.
> - Managed on the Fields page (new "Environments" section, `EnvironmentsManager.tsx`) alongside
>   Custom Fields and Configurations — OWNER/ADMIN only, same gate as those two.
> - `&env=<name>` auto-create is wired through both F-11 upload endpoints (`/api/v1/results` and
>   the permanent `/api/v1/junit` alias) via a shared `resolveOrCreateEnvironment()` in
>   `lib/environments.ts`, gated by the new `Project.autoCreateEnvs` flag (default on, toggle
>   checkbox on the Fields page). F-12 (CLI/reporters) doesn't exist yet, so only F-11 needed
>   wiring.
> - Filter chips (`?env=<id>`) added to both the runs list and the reports page as plain
>   server-rendered links (no client filter bar existed on either page before this). On Reports,
>   the chip re-scopes the project's `runs` array before any metric is computed, so pass rate,
>   trend, flaky, bug correlation and the per-run breakdown table all become "per environment"
>   automatically — no separate chart type was needed to satisfy "trend lines per environment".
> - `GET/POST /api/v1/projects/[slug]/environments` added for API parity with `/config-groups`.
> - Run CSV export gained an `environment` column (run-level, not per-row, since environment is
>   a run attribute).
> - Seed demo: two environments (Staging/Production); "Smoke Test Sprint 1" tagged Staging.
> - e2e `e2e/environments.spec.ts`: UI flow (create → tag a run → badge + filter chip) and the
>   `&env=` auto-create path via a real upload; full suite 35/35 on a fresh DB.

- `Environment { id, projectId, name, url?, order, active }`; `TestRun.environmentId String?`.
- Select at run creation (and in F-11/F-12 via `&env=<name>`, auto-create if missing —
  flag-guarded by project setting `autoCreateEnvs`, default on).
- Filter chip on runs list + reports (trend lines per environment when a filter is active).

#### F-20 — SSO (OIDC first), 2FA, SCIM (large) `[x]`

> **Status: DONE** (2026-07-13, branch `feat/sso-2fa`, built by Opus 4.8 from the Fable
> work order below). Implemented as specified, with these notes:
> - **OIDC**: generic provider via `TF_OIDC_ISSUER` (discovery cached 1 h at module scope),
>   PKCE S256 + single-use `state` + `nonce`, id_token verified against the IdP's JWKS with
>   `jose` `createRemoteJWKSet` (no new auth dep), `email_verified` required unless
>   `TF_OIDC_ALLOW_UNVERIFIED_EMAIL=1`, auto-provision gated on `TF_OIDC_AUTO_PROVISION`.
>   Routes `src/app/api/auth/oidc/{route,callback/route}.ts`; social Google/GitHub login is
>   untouched. **Deviation from the work order**: auto-provisioned/OIDC users get a random-hex
>   `passwordHash` (the existing social-login convention `hasUsablePassword` already keys on)
>   rather than `""` — same effect, matches repo precedent.
> - **2FA (TOTP)**: dependency-free RFC 6238 in `src/lib/totp.ts` (verified against the RFC
>   Appendix B vectors by `scripts/totp-selftest.mjs`, wired as `prebuild` so CI runs it before
>   every build), `User.totpSecretEnc`/`totpEnabledAt` + `TwoFactorRecoveryCode`. Two-phase
>   enroll, a pending `tf_2fa` JWT cookie so a correct password never mints a session on its
>   own, 10 single-use sha256-hashed recovery codes, wrong codes drawing down the same lockout
>   budget as wrong passwords. `qrcode` added for the enroll QR (rendered server-side).
>   **Deviation**: `confirmTotpEnroll` deliberately does NOT `revalidatePath` — revalidating
>   swaps the settings card to the "enabled" view and would hide the one-time recovery codes
>   before the user copies them.
> - **`TF_DISABLE_PASSWORD_LOGIN=1`**: rejected server-side in login/register/forgot/reset (not
>   just hidden UI); `src/instrumentation.ts` warns at boot if set with no provider configured.
> - **SAML/SCIM**: out of scope per the work order (README notes OIDC covers Google
>   Workspace/Azure AD/Okta/Keycloak). No API-v1 surface added — 2FA/SSO are session concerns.
> - e2e: `two-factor.spec.ts` (enroll → gated second step → recovery code single-use → disable,
>   on a dedicated `twofa@` fixture user) and `oidc.spec.ts` (happy path + nonce-tamper +
>   unverified-email rejection, against a local mock IdP with a `jose`-generated JWKS on a fixed
>   port). Full suite 61/61 on a fresh DB.

> **Full work order — written 2026-07-13 by Fable 5 as a security-design handoff.** §0.8 puts
> security-critical *design* on Fable; the design below is final. **Opus 4.8 implements it
> without re-deciding any security property.** Where the spec says MUST, deviation is a bug
> even if the code "works". SAML and SCIM are explicitly **out of scope** (README notes that
> OIDC covers Google Workspace / Azure AD / Okta / Keycloak).

##### 1. Threat model (what this feature must survive)

| Threat | Countermeasure (built below) |
|---|---|
| Authorization-code interception / replay | PKCE S256 + single-use `state` + `nonce` claim check |
| IdP response forgery | ID-token signature verified against the issuer's JWKS (`jose` `createRemoteJWKSet` — already a dependency, **no new auth libs**) |
| Account takeover via unverified IdP email | require `email_verified === true` claim unless `TF_OIDC_ALLOW_UNVERIFIED_EMAIL=1` |
| Session fixation across the 2FA step | password success does NOT create a session — a separate short-lived pending token does (§4) |
| TOTP brute force | wrong codes feed the same in-memory lockout as wrong passwords (`recordFailure(email)` in `src/app/actions/auth.ts`) |
| Recovery-code reuse | single-use rows, sha256-hashed like `ApiKey.keyHash` (`src/lib/auth.ts:verifyApiKey` pattern) |
| Secret leakage | `totpSecretEnc` encrypted with `src/lib/crypto.ts` (F-07 AES-256-GCM); never serialized, never logged, never in audit detail |

##### 2. Data model (add to `prisma/schema.prisma`)

```prisma
// F-20: on User —
//   totpSecretEnc String?   // crypto.ts-encrypted base32 secret; null = 2FA off
//   totpEnabledAt DateTime? // set only after the user proves one valid code

model TwoFactorRecoveryCode {
  id       String    @id @default(cuid())
  userId   String
  codeHash String    @unique // sha256 hex of the raw code, same recipe as ApiKey.keyHash
  usedAt   DateTime?
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}
```

No enum, no Json — §0.1 rules apply.

##### 3. OIDC (generic provider, env-configured)

**Files.** `src/app/api/auth/oidc/route.ts` (start) and
`src/app/api/auth/oidc/callback/route.ts`. Copy the cookie-state mechanics of
`src/app/api/auth/oauth/[provider]/route.ts` (`tf_oauth_state` pattern) — do not refactor
that file; Google/GitHub social login keeps working unchanged.

**Env** (all documented per §0.7; feature is fully dormant when `TF_OIDC_ISSUER` unset):

| Var | Meaning |
|---|---|
| `TF_OIDC_ISSUER` | e.g. `https://login.example.com/realms/acme` — no trailing slash |
| `TF_OIDC_CLIENT_ID` / `TF_OIDC_CLIENT_SECRET` | confidential client credentials |
| `TF_OIDC_AUTO_PROVISION` | `1` → unknown verified email creates a User (role `TF_OIDC_DEFAULT_ROLE` ?? `MEMBER`) |
| `TF_OIDC_BUTTON_LABEL` | login button text, default `"Single sign-on"` |
| `TF_OIDC_ALLOW_UNVERIFIED_EMAIL` | `1` → skip the `email_verified` requirement (for IdPs that omit it; README warns) |
| `TF_DISABLE_PASSWORD_LOGIN` | `1` → §5 |

**Flow (MUSTs).**
1. Start route: fetch `${TF_OIDC_ISSUER}/.well-known/openid-configuration` (in-process cache,
   1 h TTL, module-scope `let`); generate `state` (16B hex), `nonce` (16B hex), PKCE
   `code_verifier` (32B base64url) + S256 challenge. Store `{state, nonce, verifier}` JSON in
   one httpOnly `tf_oidc` cookie (`sameSite: "lax"`, `secure` in prod, maxAge 600). Redirect to
   `authorization_endpoint` with `response_type=code&scope=openid email profile`.
2. Callback: reject unless query `state` equals cookie state (then **delete the cookie** —
   single use). Exchange code at `token_endpoint` (client_secret_post + `code_verifier`),
   10 s timeout.
3. Validate `id_token` with `jose`: `jwtVerify(idToken, createRemoteJWKSet(new URL(jwks_uri)),
   { issuer, audience: clientId })` — cache the JWKS set at module scope. Then check
   `payload.nonce === cookie nonce`. Any failure → redirect `/login?error=…` with a generic
   message (log the specific one server-side; never echo token contents to the browser).
4. Map `payload.email` (lowercased) to a User. Unknown + auto-provision on → create with
   `emailVerifiedAt: new Date()` (the IdP asserted it), `passwordHash: ""` (existing
   `hasUsablePassword` treats `""` as unusable — same as social-login users). Unknown +
   auto-provision off → `/login?error=` "No TestForge account for <email>. Ask an admin to
   invite you."
5. Existing user with 2FA enabled: OIDC **skips TOTP** (deliberate: the IdP owns MFA policy;
   README states this). `createSession(user, false)`, audit `auth.login` with
   `detail: "oidc"`, honor the same `next`/onboarding redirects as `login()`.

**Login page.** When `TF_OIDC_ISSUER` is set, `/login` shows a full-width SSO button (link to
`/api/auth/oidc`) above the password form, separated by the existing "or" divider used for
social buttons.

##### 4. 2FA (TOTP, RFC 6238 — no new crypto deps)

**`src/lib/totp.ts`** (new, ~60 lines, node `crypto` only — no `otplib`):
`generateSecret()` (20 random bytes → base32), `totp(secret, t = Date.now())` (HMAC-SHA1,
30 s step, 6 digits), `verifyTotp(secret, code)` → accepts step ±1 (90 s grace);
comparison via `crypto.timingSafeEqual` on the padded strings. `otpauthUri(email, secret)` →
`otpauth://totp/TestForge:<email>?secret=…&issuer=TestForge`. Unit-tested against RFC 6238
Appendix B vectors in `scripts/totp-selftest.mjs` (plain node script, run in CI before build).

**Enrollment** (Settings → Account, new "Two-factor authentication" card,
`src/components/TwoFactorSettings.tsx` + `src/app/actions/two-factor.ts`):
1. `startTotpEnroll()` → generates secret, stores `totpSecretEnc` (encrypted) with
   `totpEnabledAt` still NULL, returns the otpauth URI. Client renders QR locally
   (dependency `qrcode` — approved) + the base32 as copyable text.
2. `confirmTotpEnroll(code)` → `verifyTotp` against the decrypted pending secret; on success
   sets `totpEnabledAt`, generates **10 recovery codes** (`crypto.randomBytes(5).toString("hex")`
   grouped `xxxxx-xxxxx`), stores sha256 hashes, returns the raw codes **once** (UI: monospace
   list + copy button + "you will not see these again"). Audit `auth.2fa_enable`.
3. `disableTotp(code)` → requires a currently valid TOTP **or** recovery code; clears both
   columns, deletes recovery rows. Audit `auth.2fa_disable`.

**Login flow change** (in `login()`, `src/app/actions/auth.ts`): after password verifies and
email is verified, if `totpEnabledAt` is set → do **NOT** `createSession`. Instead sign a
pending JWT (same `jose` `SECRET`) `{ userId, rememberMe, purpose: "2fa" }`, 5 min expiry,
set as httpOnly cookie `tf_2fa`, redirect `/login/2fa`. New page + action `verify2fa(code)`:
reads `tf_2fa` (expired/absent → back to `/login`), checks `purpose === "2fa"`, then
`verifyTotp`; on failure `recordFailure(email)` (same lockout budget as passwords) and count
`isLockedOut` **before** verifying. A recovery code (matched by hash, `usedAt` NULL) also
passes — mark it used, audit `auth.2fa_recovery_used`, and when ≤ 2 remain unused include a
banner prompting regeneration. Success → delete `tf_2fa` cookie, `createSession`, audit
`auth.login` detail `"password+totp"`.

##### 5. `TF_DISABLE_PASSWORD_LOGIN=1` (MUSTs)

Server-side rejects (not just hidden UI) in: `login`, `register`, `forgotPassword`,
`resetPassword` — each returns `{ error: "Password login is disabled on this instance." }`.
`/login` hides the password form and shows only SSO/social buttons. Boot-time console warning
if set while `TF_OIDC_ISSUER` is missing (would lock everyone out — warn, don't crash;
social OAuth may still be configured).

##### 6. Serializer & API guarantees

`totpSecretEnc`, recovery hashes, and the `tf_2fa` token never appear in any serializer, API
response, page prop, or audit `detail` (grep-level check, same bar as F-07 AC 4). No API-v1
surface is added — 2FA/SSO are session concerns; API keys are unaffected.

##### 7. Acceptance criteria

1. Keycloak dev realm: SSO button → IdP login → TestForge session; second login reuses the
   user (no duplicate). Tampered `state` or `nonce` → generic login error, no session.
2. `TF_OIDC_AUTO_PROVISION=0` + unknown email → error, no user row created.
3. Enroll 2FA → logout → login: password alone yields no session cookie (`tf_session` absent
   until the TOTP step passes); wrong code 5× triggers the same lockout message as wrong
   passwords; a recovery code works exactly once.
4. `TF_DISABLE_PASSWORD_LOGIN=1` → login action returns the disabled error even when POSTed
   directly (curl), and register/forgot/reset likewise.
5. `scripts/totp-selftest.mjs` passes the RFC 6238 vectors.
6. Fresh `docker compose up` with none of the new env vars behaves exactly as today.

##### 8. Test plan

e2e `e2e/two-factor.spec.ts`: enroll (read the base32 from the UI, compute codes in-test with
a tiny TOTP helper duplicated in the spec), verify login second step, recovery-code path,
disable. OIDC is covered by a **local mock IdP** spun up inside the spec (same technique as
`e2e/integrations.spec.ts`'s GitHub mock): a node HTTP server serving discovery, JWKS (key
generated with `jose.generateKeyPair`), `authorization_endpoint` that immediately redirects
back with a code, and a `token_endpoint` returning a signed id_token — asserts the happy path
and the bad-nonce rejection. Reuses `TF_ALLOW_INSECURE_INTEGRATION_URL`-style env:
`TF_OIDC_ISSUER=http://127.0.0.1:<port>` must be allowed when `NODE_ENV !== "production"`.

#### F-21 — Mute / quarantine flaky tests `[x]`

> **Status: DONE** (2026-07-12, branch `feat/mute-flaky`). Implemented as specified, with these
> notes:
> - Central helper `lib/mute.ts`: `bucketStatus(status, muted)` returns `"MUTED"` instead of the
>   raw status for aggregate tallies; `NON_EXECUTED_BUCKETS = ["UNTESTED","IN_PROGRESS","MUTED"]`
>   is the one list every pass-rate/executed calculation filters against. `"MUTED"` is a bucket
>   label only — never a real `TestRunResult.status` value — added to `RESULT_COLORS`/
>   `RESULT_BADGES` (grey) alongside the real enum.
> - Swept every aggregate site: Reports (KPI pass rate, trend, breakdown-per-run bar, flaky
>   detection — muted cases are excluded from the flaky list itself, already acknowledged),
>   dashboard KPI + active-runs bar, runs list per-run bar, run detail summary bar, plans list +
>   plan detail aggregate bar and per-run bar. The plan detail **Result Matrix** (per-status
>   breakdown table) was deliberately left un-bucketed — it's a detail view, not a pass-rate
>   aggregate, so a muted case's real status stays visible there (same "still showing" principle
>   as the run executor).
> - The run executor (`RunExecutor.tsx`) shows a "muted" chip per result but never changes the
>   displayed `status` — satisfies "still showing the muted failure in run detail" literally.
> - Mute requires a reason (`window.prompt`, `MuteControls.tsx`); unmute doesn't. Both call the
>   server action directly via `startTransition` (same pattern as `RunExecutor.submit`), relying
>   on the action's `revalidatePath` to refresh the page — no client-side state needed.
> - Mute is only reachable from the Reports Flaky panel (per spec); a case must have ≥2 flips to
>   appear there. `serializeResult` gained a `muted` boolean (default `false` for callers that
>   didn't join `testCase`); `serializeCase` gained `muted`/`mutedReason`. Dashboard's global pass-rate
>   query switched from `groupBy` to a raw `findMany` so results can be bucketed in JS before
>   counting — acceptable at this app's scale, consistent with how Reports already aggregates.
> - Seed demo: the case with a FAILED result in "Smoke Test Sprint 1" is muted with a reason,
>   so the seeded run visibly demonstrates the AC.
> - e2e `e2e/mute-flaky.spec.ts` builds 2-flip flaky history via the API (fast/deterministic),
>   mutes from the Flaky panel, confirms exclusion from Flaky + appearance in Muted Tests + the
>   muted chip in the run executor + the case-detail banner, then unmutes and confirms reversal.
>   Full suite 36/36 on a fresh DB.

- `TestCase.mutedAt DateTime?`, `mutedReason String?`, `mutedById String?`.
- Muted case results are recorded but excluded from pass-rate math everywhere (reports, run
  progress bar shows them in a separate grey segment "muted"), JUnit/F-11 ingestion marks their
  failures as status kept but `muted: true` in serializers.
- Reports gain "Muted tests" panel: name, reason, muted-for-N-days, last 10 outcomes sparkline
  → "unmute" button. Flaky panel gains one-click "Mute" with reason prompt.
- AC: muting a failing automated case flips a red run to green pass-rate while still showing
  the muted failure in the run detail.

#### F-22 — Importers: TestRail, Qase, TestLink `[x]`

> **Status: DONE** (2026-07-12, branch `feat/importers`). Implemented close to spec, with these
> deliberate deviations:
> - **Exact source XML/JSON schemas are documented assumptions**, not verified against a live
>   TestRail/Qase export — none was available to test against. Each parser file's header comment
>   states the assumed shape explicitly; the parsers are permissive (e.g. TestRail priority
>   accepts both a numeric id and a text label) precisely because the real-world schema can vary
>   by tool version. Treat this as the honest starting point the spec's own framing calls for
>   ("treat error messages as first-class UX") rather than a certified 1:1 format match.
> - The spec's intermediate shape `{ suitePath, title, preconditions, steps[], priority, type,
>   tags, custom{} }` omits `description`/`expectedResult` — added both (`ImportedCase` in
>   `lib/importers/types.ts`), since every source tool carries content that maps to them and
>   dropping it would make the importer lossy on data most users would expect preserved.
> - `custom{}` has no column-mapping UI in this feature (that's F-30's "saved import mappings")
>   — the committer best-effort matches a source field's label (case-insensitive) against the
>   project's active CASE custom field defs; unmatched labels are dropped silently (no type
>   validation either — an ill-fitting value just stores as a raw string).
> - The committer resolves/creates every suite path **before** the chunked case-creation
>   transactions (sequential, not inside `$transaction`) so sibling suites sharing a path never
>   race into duplicates; only the per-chunk `TestCase.create` calls run inside `db.$transaction`.
>   `recordRevision` (F-05, rev 1 "created") runs per case after its chunk commits — a real DB
>   round-trip each, acceptable at this app's target scale but a known cost on very large imports.
> - TestLink has no analog to our case `type` enum — every imported case defaults to
>   `FUNCTIONAL` (spec's shape doesn't include `automationStatus`, so `execution_type` isn't
>   mapped anywhere either).
> - Suite nesting can go deeper than 2 levels (e.g. TestRail nested sections); the DB models it
>   fine (recursive `parentId`), but the existing sidebar/CaseForm suite-tree UI only visually
>   indents 2 levels — a pre-existing app limitation, not something this feature changes.
> - Import tabs live on `projects/[slug]/import` behind `?tab=testrail|qase|testlink` (same
>   server-rendered Link-tab pattern as the case detail Details|History tabs) — CSV stays the
>   default at no query param, unchanged.
> - e2e `e2e/importers.spec.ts`: one test per tool, each uploading its fixture from
>   `e2e/fixtures/import/`, checking the preview's counts + warnings, committing, and confirming
>   an imported case is findable via the API. Full suite 39/39 on a fresh DB.

- New page `projects/[slug]/import` gains tabs: CSV (existing), TestRail XML, Qase JSON,
  TestLink XML.
- Parsers in `src/lib/importers/<tool>.ts` → shared intermediate
  `{ suites: tree, cases: [{ suitePath, title, preconditions, steps[], priority, type, tags, custom{} }] }`
  → shared committer that creates suites by path and cases (reusing `caseCounter` pattern),
  all inside one transaction per 500 cases (chunked).
- Priority/type mapping tables per tool documented in each parser file (e.g. TestRail
  priority id 4→CRITICAL). Unknown values → project defaults + counted in the preview warnings.
- Preview step mandatory (reuse `CsvImporter.tsx` UX): counts, sample rows, warnings.
- Fixture files for each tool under `e2e/fixtures/import/` + e2e per tool. This feature is
  the **adoption funnel** — treat error messages as first-class UX.

#### F-23 — Estimates & forecast `[x]`

> **Status: DONE** (2026-07-12, branch `feat/estimates-forecast`). Implemented close to spec,
> with these deviations:
> - **No unit test framework exists in this repo** (Playwright e2e only, no vitest/jest) — the
>   spec's "with unit tests" for `src/lib/duration.ts` is covered by e2e instead
>   (`estimates-forecast.spec.ts` round-trips all 3 input formats — `"90"`, `"1m 30s"`,
>   `"1:30"` — through the case form and asserts they parse to the same stored value).
> - **Forecast is per-remaining-result, not a single multiplier**: for each still-`UNTESTED`
>   result, the per-case duration is the assignee's median actual elapsed *in this run* when
>   they already have ≥5 executed results with a recorded `elapsedSeconds`, else that case's own
>   `estimateSeconds`, else the project-wide median of set estimates (120 s default when none
>   are set). Summed across all remaining results — `src/lib/estimates.ts`.
> - **Plan/milestone roll-up sums each child run's own totals** (each run's forecast uses its
>   own run-scoped tester medians) rather than recomputing one forecast over the pooled results
>   of every child run — matches "roll-up = sum of child runs" literally and keeps per-run tester
>   signal meaningful.
> - Invalid estimate text (unparseable) is rejected with a form error rather than silently
>   dropped, consistent with the title-required pattern already on the case form.
> - CSV: case export/import and run export gained an `estimate` column (human-formatted
>   duration string, e.g. `"1m 30s"`); API v1 (`POST`/`PATCH` cases, batch create) takes/returns
>   `estimateSeconds` as a plain integer. e2e `estimates-forecast.spec.ts` 3/3, full suite 42/42.

#### F-24 — Bulk move/copy & drag reorder `[x]`

> **Status: DONE** (2026-07-11, branch `feat/bulk-copy-reorder`). "Move to suite…" turned out to
> already exist — multi-select + drag onto the sidebar suite tree (`moveCases()`, shipped with
> the original suite REST API work) — so this PR only added Copy-to-project and drag-reorder.
> Deviations:
> - Copy-to-project reuses `CASE_DND_MIME`'s drag source for reorder too, but the *drop target*
>   is now also each table row (not just `SuiteDropZone` in the sidebar) — same payload, two
>   destinations. `TestCase.order Int @default(0)`, default sort `order, seq`.
> - Reorder renumbers the *currently visible* (filtered) list densely (`index × 10`) on every
>   drop rather than fractional insert-between — simplest correct option for typical suite
>   sizes; cases outside the current filter keep their existing `order` untouched.
> - `GET /api/v1/projects/{slug}/cases` intentionally still sorts by `seq` only (cursor
>   pagination wants a stable, unique key) — `order` is exposed in the serializer for clients
>   that want to mirror the UI's sort themselves, not as the list endpoint's own order.
> - Copies start as `DRAFT` (same convention as same-project clone) since custom fields may not
>   exist in the target project; shared-step refs are flattened to inline steps (groups are
>   project-scoped); attachments are duplicated as genuinely new files (storage dedupe is
>   per-project, so bytes are re-written, not just re-referenced).
> - CSV import/export and the seed script were left untouched — `order` is a UI-only
>   presentation field, not case content.
> - e2e: native HTML5 drag-and-drop doesn't fire from Playwright's `locator.dragTo()` (it drives
>   plain mouse events, not real OS-level drag); the spec dispatches `DragEvent`s by hand
>   instead. `e2e/bulk-copy-reorder.spec.ts`, full suite 31/31.

---

### 5. P3 features

Scoped briefs — expand into full work orders when picked up. **Exception:** F-35 and F-36
are already full work orders (Fable 5 design handoff, 2026-07-13 — see also appendix §7).

#### F-25 — Exploratory / session-based testing `[x]`

> **Status: DONE** (2026-07-17, branch `feat/exploratory-sessions`, Sonnet 5). Session is
> single-player (only the tester who started it may add notes / end it / convert its notes,
> mirroring run execution); any project member may read it. Convert-to-issue only renders when
> an active F-07 integration exists (mirrors IssuePanel's "stay out of the way" rule) — no
> silent failure, the button just doesn't appear.

`Session { projectId, charter, timeboxMinutes, status, startedAt, endedAt, testerId }` +
`SessionNote { sessionId, at, kind: NOTE|BUG|QUESTION|IDEA, bodyMd }`. Live session page with a
running timer, quick-add note hotkeys (N/B/Q/I), attachments per note (F-01), end-of-session
summary that can convert BUG notes → issues (F-07) and IDEA notes → draft cases. Lesson from
Test IO/Testmo; almost no OSS tool has this.

#### F-26 — Built-in defects `[x]`

> **Status: DONE** (2026-07-17, branch `feat/defects`, Sonnet 5). Board (columns by
> `DEFECT_STATUSES`) is the primary view; each card has an inline status `<select>` (client
> component `DefectStatusSelect`, same `useTransition`-server-action pattern as `CasesTable`'s
> inline priority dropdown — no drag-and-drop). Linking from results: `DefectPanel` mounted in
> `RunExecutor` next to `IssuePanel`, always visible (no external config gate, unlike F-07) with
> "Link existing" + "Report new" inline forms. `DefectLink` is polymorphic (CASE | RESULT) so
> case-level linking is schema-ready even though only the result path is wired in this pass.

`Defect { projectId, seq (DF-<SLUG>-<n>), title, severity, status: OPEN|CONFIRMED|FIXED|WONT_FIX|CLOSED, bodyMd, assigneeId }`,
linkable from results (complements, not replaces, F-07). Defects list + board (columns by
status). For teams without any external tracker (Qase parity).

#### F-27 — BDD / Gherkin `[x]`

> **Status: DONE** (2026-07-17, branch `feat/gherkin`, Sonnet 5). No schema change — a Gherkin
> case is detected purely by its `stepsJson` shape (`isGherkinCaseSteps` in `lib/steps.ts`),
> exactly `[{gherkin: "<scenario body>"}]`, never mixed with inline steps or shared-step refs.
> `expandSteps()` short-circuits it into a safe single-step passthrough (`action` = the raw
> text, plus a `gherkin` marker) so every existing consumer that only knows inline steps keeps
> working without modification; the case detail page and `CaseForm`'s format toggle special-case
> the marker to render `GherkinBlock` (hand-rolled line-based syntax highlighter, no new
> dependency) instead of a steps table. Import reuses the existing F-22 tool-importer pipeline
> unchanged (`ImportedCase.steps` widened to accept the Gherkin shape, `lib/importers/gherkin.ts`
> registered as a 4th `PARSERS` entry) — one scenario = one case, Feature name = suite, tags →
> tags; `Background:` steps are intentionally NOT merged into each scenario (no per-case home for
> them in this model). Export: `GET /api/export/gherkin?project=` groups by suite into one
> `.feature` file. Cucumber JSON matching needed no code change — F-11's existing exact-title
> matcher already works since a Gherkin case's title is the scenario name. Two round-trip paths
> (F-05 revision restore, F-24 copy-to-project) were fixed to preserve the `{gherkin}` shape
> instead of silently flattening it into a lossy single inline step.

#### F-28 — Suite baselines `[x]`

> **Status: DONE** (2026-07-17, branch `feat/baselines`, Sonnet 5). `SuiteBaseline` +
> `BaselineEntry` (pin: `caseId` + `caseRev` + a denormalized `suitePath` so the tree survives
> a later suite rename/move/delete). No content is duplicated — `caseRev` points at the
> existing F-05 `TestCaseRevision`, which already holds the full snapshot; "compare baseline vs
> current" reuses `diffSnapshots()` from `lib/case-revisions.ts` unchanged. A run "from
> baseline" (`TestRun.baselineId`) pins every result's `caseRev` to what the baseline captured
> (`buildResultSeeds` gained an optional rev-override map) — and, critically, the run detail
> page renders the PINNED revision's content (title/steps/preconditions/expectedResult), not
> the case's current content, or pinning would be cosmetic only. `NewRunForm` gained a "From
> baseline" picker that auto-selects the baseline's cases.

Snapshot an entire suite tree + case revisions (F-05) as a named baseline; runs can be created
"from baseline" pinning `caseRev`s; compare baseline vs current. TestRail Enterprise feature —
in OSS it's a headline.

#### F-29 — AI assist (BYO key) `[x]`

> **Status: DONE** (2026-07-18, branch `feat/ai-assist`, Opus 4.8). Org-level config on
> `Organization` (`aiEndpoint`/`aiModel`/`aiApiKeyEnc`, key AES-256-GCM via F-07 crypto);
> `/settings/ai` (org ADMIN, write-only key, Test button). `lib/ai.ts` calls an
> Anthropic-compatible `{endpoint}/v1/messages` with **raw fetch** (no SDK dep — matches
> `issue-providers.ts`; keeps the Docker image lean and the endpoint arbitrary), default model
> `claude-sonnet-5`, robust JSON extraction from the response text (no `output_config.format`,
> for endpoint compatibility). Three features, all opt-in per click, degrading cleanly when no
> key is set: (1) generate DRAFT cases from a pasted requirement (preview → select → insert);
> (2) suggest edge-case steps on a case; (3) near-duplicate detector = local title trigram
> similarity (`lib/case-dedupe.ts`, **no key needed**). e2e `ai-assist.spec.ts` uses a local
> mock Messages endpoint. Deferred: embeddings-based dedup (v1 is trigram per the brief).

Settings → org: provider (Anthropic-compatible endpoint), model id, encrypted API key (F-07
crypto). Features: (1) generate draft cases from a pasted requirement/PRD text → preview list →
insert as DRAFT; (2) suggest missing edge-case steps for an open case; (3) near-duplicate case
detector (embeddings optional — v1 may use title trigram similarity locally, no key needed).
All AI actions are opt-in per click, never automatic; degrade cleanly when no key configured.
Default model when the org uses Anthropic: `claude-sonnet-5`.

#### F-30 — XLSX & JSON export, saved import mappings `[x]`

> **Status: DONE** (2026-07-17, branch `feat/export-xlsx-json`, Sonnet 5). Export: `cases-xlsx`/
> `run-xlsx` reuse the exact same row-building logic as the existing CSV routes, just piped
> through a small `buildXlsx()` helper (`lib/xlsx.ts`, new dep `exceljs`); `cases-json`/`run-json`
> reuse `serializeCase`/`serializeRun`/`serializeResult` from `lib/api.ts` unchanged — "full
> fidelity" fell out for free since those serializers already existed. `?revisions=true` on the
> cases JSON export attaches each case's F-05 history via `serializeRevision`. The 4 new export
> routes plus the existing CSV/`.feature` ones are now behind one `ExportMenu` dropdown instead
> of a row of separate buttons. Column mapping: `ImportColumnMapping` (one row per project,
> upsert-only) + `applyColumnMapping()` rewrites a parsed CSV row's arbitrary headers onto the
> fixed target fields *before* the existing validation/creation logic runs — an empty mapping is
> a no-op, so CSVs that already use the expected headers are unaffected. `CsvImporter` gained a
> "Column mapping" panel (shown once headers are detected) that loads the project's saved
> mapping on mount and can persist a new one on commit.

Export cases/runs as `.xlsx` (dependency `exceljs`) and `.json` (full fidelity incl. custom
fields, revisions optional flag); CSV import column-mapping step persists mapping per project.

#### F-31 — "My work" page `[x]`

> **Status: DONE** (2026-07-17, branch `feat/my-work`, Sonnet 5). No schema change — pure
> cross-project read aggregation (`lib/my-work.ts`), every query scoped the same way the
> dashboard already scopes its stats (`{members: {some: {userId}}}`). Sidebar badge (`layout.tsx`)
> reuses the cheap `loadMyWorkCounts` query (counts only, no included relations) so it doesn't
> pull the full lists on every page load. `GET /api/v1/my-work` lives at the API root rather than
> under `/projects/{slug}` — it's inherently cross-project, and an API key is already user-scoped
> (`ApiKey.userId`), so no project param is needed. "Reviews requested from me" reuses F-15's
> existing `reviewerId`+`status=IN_REVIEW` query (same as the per-project "Needs my review" chip,
> just without the project filter).

`/my-work`: cross-project list of (a) results assigned to me in active runs, (b) cases assigned
to me, (c) reviews requested from me (F-15) — each with deep links and counts in the sidebar.

#### F-32 — Case dependencies `[x]`

> **Status: DONE** (2026-07-17, branch `feat/case-dependencies`, Sonnet 5). `CaseDependency`
> (`caseId` requires `dependsOnCaseId` to pass first). Cycle rejection is a plain DFS from
> `dependsOnCaseId` over what it transitively depends on, looking for `caseId` — no cheap DB
> constraint covers this, so it's an application-level check on every write (`wouldCreateCycle`
> in `lib/case-dependencies.ts`), surfaced as a real form error, never a silent no-op. In a run,
> `computeBlockedSuggestions` (kind-based, F-14-aware) flags a dependent whose prerequisite is
> FAILED/BLOCKED *in that same run*; the run executor shows a suggestion banner with a single
> "Accept — mark BLOCKED" button that submits through the exact same path as every other status
> button — nothing is ever applied automatically. Case detail page gained a "Dependencies"
> section (prerequisites + read-only "Required by" list).

`CaseDependency { caseId, dependsOnCaseId }` (no cycles — reject via DFS check). In a run,
when a prerequisite's result is FAILED/BLOCKED, dependents auto-suggest BLOCKED (one-click
accept, never silent).

#### F-33 — API v2 `[x]`
Full-coverage REST (`/api/v2`): milestones, members, webhooks, fields, attachments, plans,
environments; project-scoped tokens; per-key rate limits; typed OpenAPI with generated client
(`packages/api-client`). v1 stays frozen + supported.

**Shipped.** 15 route files under `src/app/api/v2/`, 34 operations across the 7 resource
groups (list/create + get/patch/delete each; attachments upload multipart and have no PATCH
since file bytes are immutable).

- **Core layer** — `src/lib/api-v2.ts`. `guardV2()` mirrors v1's session-then-Bearer order but
  consumes the *key's own* budget and returns the key so `resolveProject()` can enforce scope.
  Nothing here is imported by v1, so v1 is frozen by construction, not by discipline.
- **Project-scoped tokens** — `ApiKey.projectId` (null = org-wide, the v1 behaviour). A scoped
  key gets **403** on any other project even when its owning user is a member there. The check
  deliberately 403s rather than 404s: the caller holds a valid key, so "wrong project for this
  key" is actionable and leaks nothing its own key metadata wouldn't.
- **Per-key rate limits** — `ApiKey.rateLimitPerMin` (null = global `API_RATE_LIMIT`). Buckets
  are keyed by key id, so exhausting one key never touches another. *Every* key-authed response
  carries `X-RateLimit-*`; v1 only sent them on the 429.
- **Uniform pagination** — every collection takes `page`/`perPage` (clamped, never a 422) and
  returns `{ items, meta }`. This is a real v2-only fix: v1 is inconsistent, returning
  `{data, total, nextCursor}` for cases but bare `{items}` for environments.
- **OpenAPI + client** — `src/lib/openapi-v2.ts` served at `/api/v2/openapi`, hand-written
  beside the routes as v1's is. `packages/api-client` generates types and one method per
  operation from that document; output is checked in so consumers never run the generator.
  Explicit `operationId`s keep names clean (`createMilestone`, not `createAMilestone`), and the
  error schema is `ApiError` so the generated types don't shadow the global `Error`.
- **Docs** — `/docs/api` gained a v1/v2 switcher; v1 stays the default so existing bookmarks
  land on the API their integrations actually use.

Deletes detach rather than cascade wherever test history is at stake: removing a milestone,
plan or environment nulls the reference on its runs and keeps every result.

Gotchas for the next person: `buildCombinations()` takes resolved `{name, options}` config
groups (not a map) and plan creation must filter `deletedAt: null`; the webhook `events` column
is comma-separated, not JSON; and `Milestone` has only id/name/dueDate/status — no description
or completedAt — so don't serialize fields that aren't there.

#### F-34 — LDAP / Active Directory `[x]`
Self-hosted-only login backend via env (`TF_LDAP_URL`, bind DN, user filter); maps to org
members. Parity with TestLink/Kiwi for enterprises that lack OIDC.

#### F-35 — Print & PDF-friendly case/run views `[x]`

> **Full work order — written 2026-07-13 by Fable 5 as a design handoff.** Fable was the
> assigned model for this feature; this spec encodes every design decision at implementation
> depth so **Opus 4.8 (or any model) can build it without further design judgment**. Where a
> choice was aesthetic, the choice is already made below — do not re-litigate, just build.
> Read §7 (Fable design handoff appendix) first for the token vocabulary used here.

**One-liner:** dedicated print routes render a clean paginated document (cover block, TOC,
cases with expanded steps / run results); PDF comes from the browser's own print dialog — **no
server-side PDF dependency, ever** (no puppeteer, no chromium in the Docker image).

**Why dedicated routes, not `@media print` on existing pages** (decision, final): the app
shell (`src/app/(app)/layout.tsx`) is a fixed `w-60` dark sidebar + interactive tables with
truncation, virtualized-ish lists, and hover-revealed controls. Hiding all of that with print
CSS is a losing whack-a-mole; auditors also want a *document*, not a screenshot of an app.
So: a separate route group with its own minimal layout, sharing the same server loaders.

##### 1. Routes & files

| File | Purpose |
|---|---|
| `src/app/print/layout.tsx` | Minimal layout: white page, no sidebar, imports `print.css`, renders `<PrintToolbar/>` |
| `src/app/print/print.css` | All print-specific CSS (see §4) — plain CSS import, not a Tailwind layer |
| `src/app/print/projects/[slug]/cases/page.tsx` | Case catalog document (whole project or one suite / saved-view filter) |
| `src/app/print/projects/[slug]/runs/[runId]/page.tsx` | Run report document |
| `src/components/PrintToolbar.tsx` | Client comp: floating "Print / Save as PDF" button (`window.print()`), hidden by `@media print` |
| `src/components/icons.tsx` | Add a `print` glyph to the existing TFIcon set (printer outline, same 24-box, `tf-ac`/`tf-acf` classes) |

- **Auth**: these are NOT public. Each page opens with `requireSession()` + the same
  project-membership check the `(app)` pages use (`memberScope`). Print pages must never be
  reachable logged-out — the public surface stays `/share/[token]` (F-17) only.
- **Query params** for the cases document: `?suite=<id>` (that subtree only) and
  `?view=<savedViewId>` (apply an F-10 saved view's filter). Both optional; default = every
  ACTIVE case in the project, suite-tree order.
- **Entry points** (all `target="_blank" rel="noopener"`, icon `print`, label "Print view"):
  1. Cases page toolbar (next to the CSV export button).
  2. Case detail page header — links to the cases document with `?case=<id>` → renders a
     one-case document (same template, cover block collapses to a slim header).
  3. Run detail page header (next to Share, F-17).

##### 2. Document anatomy (cases catalog)

Top-to-bottom, exactly:

1. **Cover block** (first page, `break-after: page`): TestForge logo mark (the existing
   `Logo` component, dark-on-white variant), then in `--font-display`:
   document title (`<project name> — Test Case Catalog`), subtitle line in slate-500
   (`<n> cases · <m> suites · generated <YYYY-MM-DD HH:mm> · by <user name>`), and — when a
   `suite`/`view` filter is active — a bordered "Scope" box listing the human-readable filter
   (suite path, or the saved view's name + its filter chips as plain text). No decoration
   beyond a single `2px solid #1b1a22` rule under the title. Auditors file these; the cover
   must carry provenance.
2. **TOC**: flat list of suites in tree order, `<a href="#suite-<id>">` anchors, dotted
   leaders NOT required (CSS leaders are unreliable across print engines — plain list,
   suite path in sans, case count right-aligned via flex). Chrome/Firefox print preserves
   in-document links in the PDF, so the TOC is clickable in the exported file for free.
3. **Body**: per suite, an `<h2 id="suite-<id>">` with the full suite path
   (`Parent / Child`), then each case as a `<section class="tf-print-case">`:
   - Header row: `displayId` in `--font-mono` slate-500 + title in semibold + right-aligned
     priority as **outlined text chip** (see §4 badge rule).
   - Meta line (only fields that are non-empty): type, status (F-15 workflow status),
     tags, assignee, estimate (F-23), linked requirements (F-18 refIds).
   - Preconditions (rendered Markdown), steps table — **steps arrive pre-expanded via F-04
     exactly like `RunExecutor` gets them** (reuse the same expansion loader; shared-step
     origin shown as a small `⛓ <title>` prefix in slate-500), 3 columns
     `# | Action | Expected`, then Expected result, then custom fields (F-03) as a
     `dt/dd` grid.
   - Attachments: listed by filename + size only (no inline images except image attachments
     under 1 MB, rendered `max-height: 60mm` — a paper doc with 40 full-res screenshots
     is a printer DoS).
4. **Footer** on every page via `@page` margin — see §4; plus a final line
   `Generated by TestForge — <absolute URL of the live page>` so paper always points back
   to the living system.

##### 3. Document anatomy (run report)

Same skeleton, with:

1. Cover: `<project> — Run report: <run name>`, subtitle
   `<status> · started <date> · <environment (F-19)> · <plan/config if any (F-06)>`.
2. **Summary block** (this replaces the TOC): a plain table of status → count → percent,
   ordered by the project's status defs (F-14), each status name prefixed by its glyph
   (`✓ ✕ ⊘ → ↻ •` — the same `KEY_ICONS`/`KIND_ICONS` map as `RunExecutor.tsx`), pass rate
   line computed **excluding muted cases (F-21)** exactly like the dashboard does, and a
   horizontal 100%-stacked bar: one flex row of divs, each status's `badgeStyle` color,
   `print-color-adjust: exact`, 6 mm tall, 1 px `#1b1a22` outer border so it still reads
   as segments when printed grayscale.
3. Body: results grouped by suite; each result = case header row (displayId, title, dataset
   name chip (F-13) if any, muted chip (F-21) if muted) + status chip + elapsed + assignee +
   comment (Markdown) + defect links (F-07 issue keys + built-in defectUrl). Steps are
   **collapsed by default in the run report** (one line: "n steps — see case catalog");
   `?steps=1` expands them using the §2 case template. A run report's job is outcomes;
   the catalog's job is procedure.
4. Regression annotation: when the run has a previous completed run of the same source,
   annotate each FAILED-kind result that passed previously with `↓ regression` in the meta
   line (reuses the F-17 comparison query — it already exists, `RunCompare` imports it).

##### 4. Print CSS — exact rules (`src/app/print/print.css`)

The design intent: **ink on paper, brand carried by typography and structure, not color.**
Screen preview of the print route should look like the paper output (white page, centered
`max-width: 180mm` column, `box-shadow` page illusion is NOT wanted — keep it plain).

```css
/* Page geometry */
@page { size: A4; margin: 18mm 16mm 20mm; }
/* Chrome ignores @page margin-box content (page numbers) — accepted limitation.
   Do NOT try position:fixed running footers: they overlap content unpredictably
   across engines. The per-section footer line from §2.4 is the provenance. */

/* Typography: print is the one surface where the app's text-sm 14px idiom is wrong.
   Body 10.5pt/1.45 IBM Plex Sans; h1 20pt, h2 13pt, h3 11pt in Space Grotesk
   (same var(--font-display) — next/font variables are on <body>, they work here);
   displayId / meta labels 8.5pt var(--font-mono) uppercase +0.04em. All text #1b1a22
   (ink token) on white; secondary text #475569 (slate-600) — nothing lighter than
   slate-600 on paper (slate-400 disappears on office printers). */

/* Fragmentation */
.tf-print-case { break-inside: avoid; }          /* a case never splits… */
.tf-print-case.tf-long { break-inside: auto; }   /* …unless taller than ~1 page: the
     server marks tf-long when steps.length > 12 — an unsplittable 2-page block causes
     a full blank page, which is worse than a split. */
h2 { break-after: avoid; }                        /* no orphaned suite headings */
section, tr { orphans: 3; widows: 3; }
.tf-print-cover { break-after: page; }

/* Color flattening — print.css overrides for shared components */
.tf-markdown pre { background: #f8fafc !important; color: #1b1a22 !important;
                   border: 1px solid #cbd5e1; }   /* the screen pre is slate-900-dark —
                                                     never ship a black slab to a printer */
.tf-markdown a { color: inherit; text-decoration: underline; } /* blue ink lies on paper */
.tf-markdown a[href^="http"]::after { content: " (" attr(href) ")";
                   font-size: 8pt; color: #475569; }  /* URLs must survive paper */
img { max-width: 100%; max-height: 60mm; }

/* Badge rule (priority/status/type chips): on paper a colored pill prints as mud.
   Every chip becomes: 1px solid currentColor outline, transparent bg, its glyph + label,
   font 8.5pt mono uppercase. Color is kept (print-color-adjust: exact) as a hint for
   color printers but the glyph+outline carries the meaning in grayscale. */
```

`PrintToolbar` (floating bottom-right, `position: fixed`, accent `#4f46e5` filled button,
`@media print { display: none }`): label "Print / Save as PDF", plus a "Close" text link.
Before calling `window.print()` set `document.title` to
`<project-slug> — <doc name> — TestForge` — that string becomes the default PDF filename in
every browser; it's the cheapest professional touch in this whole feature.

##### 5. Implementation order & AC

1. Icon + layout + toolbar + print.css skeleton.
2. Cases document (reuse the cases page server query + F-04 expansion loader — extract to
   `src/lib/case-doc.ts` if the page has it inline; do not duplicate the query).
3. Run document (reuse run detail loaders + F-17 comparison query).
4. Entry-point buttons on the three pages.
5. e2e `print-views.spec.ts` (Playwright): use `page.emulateMedia({ media: "print" })`.

**AC:**
- [ ] `/print/projects/<slug>/cases` logged-out → redirect to login; non-member → 404.
- [ ] Catalog shows every ACTIVE case with steps **expanded** (a case using shared steps
      (F-04) prints the real steps, with the ⛓ origin marker).
- [ ] `?suite=` and `?view=` filter correctly and the Scope box states the filter.
- [ ] Run report totals match the run page (muted excluded from pass rate), stacked bar
      segments sum to 100%, `?steps=1` expands procedures.
- [ ] Under `emulateMedia print`: toolbar hidden, cover is its own page
      (`break-after` computed), `.tf-markdown pre` computes a light background.
- [ ] `document.title` is the document name when the toolbar is used.
- [ ] Docker note: everything here is routes + a CSS import → bundles into `.next`;
      **no `public/` needed, no Dockerfile change** (contrast with F-36, which needs one).

#### F-36 — Mobile execution PWA `[x]`

> **Status: DONE** (2026-07-18, branch `feat/mobile-pwa`, all four parts in one PR). Built as
> written. Notes/deviations: (1) `PwaRegistrar` + a responsive **`AppShell`** wrapper were added
> — the work order scoped Part D to `RunExecutor`, but the app shell's fixed `w-60` sidebar +
> `ml-60` main broke a 375 px viewport, so the shell became an off-canvas drawer below `md`
> (desktop pixel-identical via `md:` prefixes). `ProjectTabs` scrolls horizontally and the run
> header wraps on narrow screens for the same reason (both `md:`-gated). (2) Idempotency uses a
> `ResultSubmission` ledger table (clientId claimed inside the write transaction). (3) `Toast`
> already existed from L-04 and is reused for the conflict toast. (4) The online submit still
> carries F-03 custom fields via the JSON route; only the offline queued body is status-only,
> per spec. (5) Part B (service worker) never registers in dev, so its AC is a manual prod-image
> check — e2e `pwa-mobile.spec.ts` covers Parts A/C/D.

> **Full work order — written 2026-07-13 by Fable 5 as a design handoff** (same contract as
> F-35's note: design decisions are final, build them as written; read §7 first).
> The user story: a tester walks a lab floor with a phone/tablet, executes a run, loses
> Wi‑Fi between rooms, keeps recording, and nothing is lost. Kills the pain no competitor
> solves well. Four independent parts — **build and PR them in this order** (A and B are
> shippable alone; C depends on nothing but is riskier; D is pure UI):

##### Part A — Installability (manifest + icons + viewport)

- `src/app/manifest.ts` (Next Metadata route, bundles into `.next` — no static file):
  `{ name: "TestForge", short_name: "TestForge", start_url: "/dashboard",
  display: "standalone", background_color: "#f8fafc" /* slate-50, the app bg */,
  theme_color: "#0f172a" /* slate-900 — matches the sidebar, so the status bar melts
  into the shell */, icons: [192, 512, plus 512 "maskable"] }`.
- Icons: derive from `src/app/icon.svg` (the existing mark). Maskable variant = mark at 60%
  size centered on a `#4f46e5` accent-filled square (safe-zone rule: nothing meaningful
  outside the central 80% circle). Export PNGs into `public/icons/`.
- **⚠️ THE DOCKER GOTCHA (this repo's #1 trap, already bit F-37):** the repo currently has
  **no `public/` directory at all**, and the `Dockerfile` runtime stage copies only
  `.next/`, `node_modules/`, `prisma/`. Any file placed in `public/` (icons here, `sw.js`
  in Part B) will 404 in every production deploy **unless you add**
  `COPY --from=builder /app/public ./public` to the runtime stage. Do this in the same
  commit that creates `public/`. `.dockerignore` is fine as-is (it doesn't exclude it).
- Root layout: add the `viewport` export (`src/app/layout.tsx` has none today):
  `export const viewport: Viewport = { width: "device-width", initialScale: 1,
  viewportFit: "cover", themeColor: "#0f172a" }`.
- AC: `GET /manifest.webmanifest` 200 in the production Docker image; Lighthouse PWA
  "installable" passes; Add-to-Home-Screen opens standalone at /dashboard.

##### Part B — Service worker (hand-rolled, ~80 lines, no workbox/next-pwa dependency)

- `public/sw.js`. Strategy — deliberately minimal, an SW bug can brick every client until
  its cache version rotates, so the SW does only three things:
  1. `install`: precache exactly one URL, `/offline` (a new static page: logo, "You're
     offline", "Anything you recorded is queued and will sync automatically" — reassurance
     copy matters here, see Part C) then `skipWaiting()`.
  2. `fetch`, navigation requests (`request.mode === "navigate"`): network-first,
     `catch` → serve cached `/offline`.
  3. `fetch`, `/_next/static/` (content-hashed, immutable): cache-first.
  **Everything else — every `/api/` and server-action POST — passes through untouched.**
  Never cache API responses; a stale run list is worse than an offline page.
- Version string const at top (`const V = "tf-sw-1"`); `activate` deletes caches with other
  prefixes. Bump V on any SW change.
- Registration: `src/components/PwaRegistrar.tsx` (client, renders null), mounted once in
  `src/app/(app)/layout.tsx`; `if (process.env.NODE_ENV === "production" &&
  "serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js")`. **Never
  register in dev** — a dev-cached SW poisons localhost for every other project.
- AC: prod build → DevTools offline → navigating anywhere renders `/offline`; static assets
  served from cache; API requests visible in network tab (not from SW cache).

##### Part C — Offline result queue

**The core constraint that shapes everything:** result submission today is the server action
`submitResult` (`src/app/actions/runs.ts:97`). Server-action POSTs are keyed by build-scoped
encrypted action IDs — they **cannot be queued and replayed** across a deploy, and failed
action calls don't serialize cleanly into IndexedDB. So the offline path needs a plain JSON
endpoint, and to avoid two drifting validation paths:

1. **Extract** the body of `submitResult` (membership check → `run.execute` permission
   (F-14) → status validated against `loadStatusDefs` (F-14) → F-03 custom-field handling →
   write) into `src/lib/save-result.ts` `saveResult(userId, resultId, input)`. The server
   action becomes a thin FormData adapter around it. **One validation path, two transports.**
2. New route `POST /api/runs/results/[resultId]` (session-cookie auth via the same
   `requireSession`; same-origin `fetch` sends cookies by default, nothing special needed).
   Body: `{ status, comment?, defectUrl?, elapsedSeconds?, clientId, recordedAt }` where
   `clientId` = UUID minted at enqueue time (idempotency: the route upserts a processed-ids
   check so a double-flush can't double-append F-05-style history), `recordedAt` = ISO time
   the tester actually pressed the button (not flush time — audit truth).
   Response: `{ ok: true, conflict: null | { theirStatus, theirName, theirAt } }` —
   conflict is populated when the stored result's `updatedAt > recordedAt` and the last
   writer isn't me: **last-write-wins is kept** (my flush overwrites) but the loser is
   *reported*, never silent.
3. Client queue `src/lib/offline-queue.ts` — raw IndexedDB, no dependency (~60 lines):
   DB `tf-offline` v1, store `pending` keyed by `clientId`, records
   `{ clientId, resultId, payload, recordedAt, tries }`.
   API: `enqueue(item)`, `flush()` (in `recordedAt` order, sequential — order matters when
   the same case is re-recorded), `count()`, `subscribe(cb)` for badge updates.
   `flush()` triggers: window `online` event, `visibilitychange → visible`, executor mount,
   and after every successful direct submit. Per-item: on HTTP 4xx → drop + error toast
   (it will never succeed); on network error → keep, retry next flush (no timer backoff
   needed — the triggers above are the backoff).
4. `RunExecutor.tsx` submit path becomes: `fetch` the JSON route with a 6-second
   `AbortController` timeout → on success, exactly today's behavior; on abort/network-error →
   `enqueue()` + **optimistic UI**: the row shows the chosen status immediately plus an
   amber chip `⟳ queued` (`data-testid="queued-chip"`); a persistent header pill
   `n queued — will sync when online` (amber-100/amber-800, the app's standard warning
   recipe) while `count() > 0`, flipping to a brief green `All changes synced` on drain.
5. Conflict toast: no toast primitive exists in the repo yet — add
   `src/components/Toast.tsx` (bottom-center, slide-up 200 ms ease-out, auto-dismiss 6 s,
   `role="status" aria-live="polite"`, max 3 stacked). Conflict copy, exactly:
   `Overwrote <theirName>'s "<theirStatus>" from <relative time> on <displayId>` — names the
   loser, states the winner, no undo in v1 (the F-05-style result history keeps the
   overwritten value recoverable; an undo button is a v2 nicety).
- AC: DevTools offline → record 3 results → 3 queued chips + header pill; back online →
  auto-flush in order, chips clear, pill turns green then disappears; double-flush (two tabs)
  doesn't duplicate history (clientId idempotency); a conflicting write from another user
  surfaces the toast with their name; 403 (permission revoked mid-queue) drops the item with
  an error toast instead of retrying forever.

##### Part D — Mobile executor layout (`RunExecutor.tsx`, breakpoint `md` = 768px)

Today's executor is a two-pane desktop layout (case list rail + detail card). On `<md`:

- **Single-card flow**: the list pane disappears; one case fills the viewport. Sticky top
  bar (slate-900, white text — continues the shell): back link, `12 / 40` position in
  `--font-mono`, and a 3 mm progress strip underneath (flex row, per-status
  `badgeStyle` colors, same recipe as F-35's stacked bar). Tapping the `12 / 40` opens the
  full case list as a bottom sheet (80vh, scrollable, same rows as the desktop rail) for
  random access — walking testers mostly go next-next-next, the sheet is the escape hatch.
- **Status buttons = the thumb zone.** Fixed bottom bar, safe-area-inset padding
  (`env(safe-area-inset-bottom)`, needs Part A's `viewport-fit: cover`): a 2-column grid of
  the project's submittable statuses (F-14 `submittableDefs`, same order as desktop), each
  button `min-height: 52px`, `rounded-xl`, glyph + label, **filled** with its
  `badgeStyle` background at full opacity (the desktop chips are pastel; sunlight on a lab
  floor needs contrast — text white or ink per WCAG against each status color, compute once
  in `lib/result-statuses.ts` as `onColorOf(key)`). Tap = submit + auto-advance to the next
  un-executed case (the desktop behavior after keyboard submit) with a 150 ms slide.
- **Swipe** left/right = next/prev case. Raw `touchstart/move/end` on the card (no gesture
  dep): commit when `|dx| > 56px && |dy| < 32px && duration < 600ms`, live-follow the finger
  with `translateX` capped ±80 px, spring back otherwise; disable entirely under
  `prefers-reduced-motion` (buttons `‹ ›` in the top bar are the always-present fallback,
  also the desktop affordance). Swipe **never submits** — movement and mutation stay on
  separate gestures, misfires are unrecoverable trust-killers.
- Comment / attachments / custom fields / issue links collapse behind one `Details`
  disclosure under the steps (closed by default — the 90% path is read-steps → tap-status).
  Keyboard shortcuts (F-14) stay desktop-only (`window.matchMedia("(min-width: 768px)")`).
- Steps render at `text-base` (16px) on `<md` — the desktop `text-sm` is too small at
  arm's length. Preconditions keep their amber box. Everything else inherits.
- AC: at 375×812 (iPhone-ish viewport in Playwright): no horizontal scroll; status buttons
  ≥ 52 px tall and fully visible above the home indicator; swipe advances (dispatch
  `Touch` events per the bulk-reorder spec's precedent — Playwright can't native-swipe);
  bottom sheet opens/scrolls/jumps to a case; desktop ≥768px is **pixel-identical to
  today** (zero regression — run the existing `runs.spec.ts` unchanged).

**e2e:** `pwa-mobile.spec.ts` — Parts A+C+D assertions above; use
`context.setOffline(true/false)` + `page.dispatchEvent(window, "online")` for the queue;
skip SW registration testing in dev (Part B's AC is a manual prod-image check, note it in
the PR description). Reminder from the repo's e2e conventions: reporters run via subprocess
(root `type: commonjs`), Prisma force-reset needs the consent env.

#### F-37 — In-app user docs / help center `[x]`

> **Status: DONE** (2026-07-11, branch `feat/help-center`). Implemented as specified, with one
> deviation: content lives in `src/content/help/*.ts` (TS modules exporting a markdown string),
> not `docs/help/*.md` files read from disk at request time. **Why:** the production Docker image
> (`Dockerfile`) only copies `.next/`, `node_modules/`, and `prisma/` into the runtime stage —
> plus `.dockerignore` excludes `*.md` outright — so raw markdown files on disk would 404 in every
> self-hosted deployment. TS modules bundle into `.next` like any other source file (confirmed via
> `generateStaticParams` → the `/docs/help/[topic]` pages build as static HTML), so this works
> identically in dev and in the single-command Docker deploy. `/docs/help` index + 9 topic pages,
> "Help" nav entry (new `nav-help` icon) in the app shell, and a link from the empty test-case
> table state. e2e `help-center.spec.ts`, full suite 32/32.

---

### 6. Leapfrog features

These make TestForge **better than** TestRail/Qase/TestLink — not just equal. All are small-to-medium and highly marketable.

#### L-01 — Live quality badge (shields.io-style SVG) `[x]`

**No competitor has this.** A public, cacheable SVG badge showing a project's latest pass rate —
embeddable in README/wiki like a CI badge.

- `BadgeToken { projectId, token, revokedAt? }` (opt-in per project, Settings → "Badge").
- `GET /badge/<token>.svg?metric=passrate|automation|cases&label=<text>` → self-generated SVG
  (two-cell shield: label + value; green ≥90, amber ≥70, red below; template literal, no deps),
  `Cache-Control: public, max-age=300`, no auth (token IS the auth; revocable), no project
  data beyond the number.
- Also `GET /badge/<token>.json` (shields.io `endpoint` schema) for custom styling.
- **Exact SVG design (Fable handoff, 2026-07-13 — build as written):** flat shields.io
  idiom so it sits naturally beside CI badges. Height 20; two cells; label cell
  `#555`, value cell `#4c1` (≥90) / `#dfb317` (70–89.99) / `#e05d44` (<70); text
  `Verdana,Geneva,DejaVu Sans,sans-serif` 11px, white, with the classic 1px
  `fill-opacity=".3"` dark copy offset +1px down for the embossed look; whole shield
  `rx="3"` clip; the shields gloss `<linearGradient>` (`#bbb` .1 → 0 .1) overlaid.
  Width math without measuring fonts: `cellWidth = 6 * text.length + 10 + (13 if the label
  carries the mark)`. Label cell leads with the TestForge mark as a 13×13 path (white,
  from `src/app/icon.svg` geometry) — that mark is what distinguishes it in a README badge
  row. Value text: `98.2%` (one decimal, trailing `%`) for passrate/automation, plain int
  for cases. Unknown/no-completed-run state: value cell `#9f9f9f`, text `no runs`.
  Template literal in `src/app/badge/[token]/route.ts`, zero deps; ~40 lines including the
  color ramp.
- AC: badge renders in a GitHub README; revoking the token → 404; number matches the latest
  completed run's pass rate (muted tests excluded per F-21).

#### L-02 — CI quality gates `[x]`

**TestRail/Qase make you script this; TestForge makes it one call.**

> **Full work order — written 2026-07-13 by Fable 5.** Semantics below are final; the tricky
> part of this feature is not code volume but *definition precision* — every check is pinned
> down here so CI verdicts are deterministic and disputes point at the doc, not the code.

##### 1. Policy storage & UI

Add `gatePolicyJson String?` to `Project` (null = no gate configured → endpoint returns 404
`notFoundError("No gate policy configured")`). Shape (validated by
`src/lib/gate.ts:parseGatePolicy`, unknown keys rejected):

```ts
type GatePolicy = {
  minPassRate?: number;        // 0..100; check passes when passRate >= value
  maxNewFailures?: number;     // >= 0
  blockOnUntested?: boolean;   // true → any UNTESTED/IN_PROGRESS (non-muted) result fails the gate
  requiredTags?: string[];     // every non-muted case carrying ANY of these tags must have PASS-kind status
};
```

UI: "Quality gate" card on the project Fields/settings page (same page as F-06 configurations;
OWNER/ADMIN, action `src/app/actions/gate.ts:saveGatePolicy`, audit `project.gate_update`).
Four labeled inputs + an inline preview of the current latest-run verdict (server-rendered,
reuses `evaluateGate`). Empty form ⇒ `gatePolicyJson = null`.

##### 2. Semantics (`src/lib/gate.ts:evaluateGate(projectId, runId)` — single source of truth)

All math is **kind-based** (F-14: `statusMeta(...).kind ∈ PASS|FAIL|BLOCKED|NEUTRAL`) and
**mute-aware** (F-21: muted cases excluded everywhere, same as `lib/mute.ts` bucket rules):

- `passRate` = PASS-kind / executed, where executed excludes `NON_EXECUTED_BUCKETS` and muted.
  Zero executed results → passRate 0 (a gate on an empty run must fail loudly, not
  divide-by-zero to green).
- `newFailures` = count of rows (key = `caseId + datasetName`, F-13) whose kind is
  FAIL/BLOCKED in the gated run **and** was PASS in the *baseline* run. Baseline = the most
  recent **COMPLETED** run of the same project with the same `source`, `createdAt` earlier
  than the gated run, excluding the gated run itself; no baseline → check passes vacuously
  with `actual: 0` and `note: "no previous run"`. This is `deltaOf(...) === "REGRESSION"` from
  `runs/compare/page.tsx` — extract that helper into `src/lib/run-compare.ts` and import it
  in both places rather than duplicating (mechanical move, zero behavior change).
- `requiredTags`: for each listed tag, every non-muted case in the run carrying that tag must
  have PASS-kind. Failing detail lists up to 10 offending display ids. A tag matching zero
  cases in the run **fails** (`expected: ">=1 case tagged smoke"`) — a typo'd tag must not
  silently gate green.
- Checks only run for keys present in the policy. Response:
  `{ pass: boolean, run: { id, name, status, completedAt }, checks: [{ name, expected, actual, pass, note? }] }`.

##### 3. Endpoint

`GET /api/v1/projects/[slug]/gate?run=<id|latest>` — §0.3 pattern, `guard(req)` (read scope;
gates are consumed by CI which should hold read keys). `run=latest` (default) = newest run of
the project by `createdAt` **regardless of status** — the CLI's `--wait` handles incompleteness;
an ACTIVE run evaluates against current results and the response's `run.status` says so.
HTTP 200 whether passing or failing (the `pass` field decides; non-200 is reserved for real
errors). Add to `src/lib/openapi.ts` + docs page. No webhook (CI polls; nothing mutates).

##### 4. CLI (`packages/cli/bin/testforge.js` — extend, same zero-dep style)

`testforge gate --project <slug> [--run <id|latest>] [--wait <seconds>] [--url] [--token]`
1. `--wait N` (default 0): poll every 5 s until `run.status === "COMPLETED"` or N seconds
   elapse; timeout → print `gate: timed out after Ns waiting for run to complete` → **exit 1**.
2. Print an aligned table: `CHECK | EXPECTED | ACTUAL | RESULT` (`pass` → `OK`, else `FAIL`)
   plus a final line `gate: PASS` / `gate: FAIL`. No color codes (CI logs).
3. Exit 0 iff `pass === true`. Any HTTP/parse error → stderr + exit 1 (a broken gate must
   block, not wave through).

##### 5. Docs & example

Help center (`src/content/help/`): extend the automation topic with a "CI quality gates"
section containing this exact GitHub Actions step (verified against seed data in the e2e):

```yaml
- name: TestForge quality gate
  run: npx testforge-cli gate --project web --run latest --wait 600
  env:
    TESTFORGE_URL: ${{ vars.TESTFORGE_URL }}
    TESTFORGE_TOKEN: ${{ secrets.TESTFORGE_TOKEN }}
```

##### 6. Acceptance criteria

1. Seeded project + policy `{minPassRate: 95}`: the seeded run (has failures) gates FAIL with
   `actual` matching the reports page pass rate to one decimal; muting the failing case flips
   the same call to PASS (F-21 consistency).
2. `maxNewFailures: 0`: baseline run all-pass, new run with one regression → FAIL listing 1;
   rerun with the regression fixed → PASS. First-ever run → vacuous PASS with the note.
3. `requiredTags: ["smoke"]` with a failing smoke-tagged case → FAIL naming its display id;
   a tag matching nothing → FAIL (typo guard).
4. CLI exit codes 0/1 verified in the e2e via a subprocess call (same technique the F-12
   reporter e2e uses — root `package.json` is commonjs, spawn with `node`).
5. No policy configured → 404; policy saved by a MEMBER → server-side rejected.

##### 7. Test plan

e2e `e2e/gate.spec.ts`: seeds two runs via the results API (baseline + regressed), saves a
policy as admin through the UI, asserts endpoint JSON for AC 1–3, then spawns the CLI for
AC 4. `scripts/`-level unit coverage is unnecessary — `evaluateGate` is exercised through the
endpoint.

#### L-03 — Test cases as code (GitOps sync) `[x]`

**Unique among all TCM tools.** Two-way sync between a `tests/` folder of YAML files in the
user's repo and TestForge — cases reviewed in PRs like code.

- Canonical YAML schema (documented in `docs/CASES-AS-CODE.md`, one case per file or per-suite
  files):
  ```yaml
  id: TC-WEB-001          # empty for new cases; assigned on first push
  title: Login with valid credentials
  suite: Auth/Login
  priority: HIGH
  tags: [smoke, auth]
  preconditions: |
    User exists
  steps:
    - action: Open /login
      expected: Form visible
  ```
- CLI (F-12): `testforge cases pull` (server → files; deterministic formatting so diffs are
  clean), `testforge cases push` (files → server; **3-way merge** using a `.testforge.lock`
  base state file: local-only change → push, server-only → pull-on-next, both → conflict list,
  exit 1, `--force-local|--force-server` to resolve), `testforge cases status`.
- Server side needs only one new endpoint: `POST /api/v1/projects/[slug]/cases/sync` accepting
  a batch of upserts keyed by display id, returning assigned ids — everything else exists.
- AC: round-trip pull→edit file→push→pull is idempotent; conflicting title edits exit 1 with
  a readable conflict report; new YAML case gets a TC id back into the file.

> **Full work order — written 2026-07-13 by Fable 5.** The design risk here is sync-state
> corruption; every decision below exists to make the failure mode "exit 1 with a report",
> never "silently overwrote". Build the CLI merge logic exactly as specified.

##### 1. Canonical YAML (documented in `docs/CASES-AS-CODE.md`, written as part of this feature)

One case per file, path = `<dir>/<suite path slugified>/<display id>.yaml` (new cases:
`<slug of title>.yaml` until the first push assigns an id, after which the CLI renames the
file). Field order is FIXED (id, title, suite, priority, type, tags, preconditions, steps,
expected) — pull always emits this order, multiline strings always as `|` block scalars,
2-space indent, no flow collections except `tags`. Determinism is what makes PR diffs
reviewable; it is an AC, not a nicety. Out of scope in v1 (documented): custom fields,
datasets, shared-step references (a case using shared steps pulls **expanded** with a
`# shared: <title>` comment and pushes back as inline — the doc warns editing those files
breaks the link).

##### 2. CLI commands (`packages/cli` — new dependency `yaml`, the only one; keep node ≥18)

State file `.testforge.lock` (JSON, committed to the user's repo) = the **base** snapshot:
`{ project, url, pulledAt, cases: { [displayId]: { hash: <sha256 of canonical YAML>, rev } } }`.

- `testforge cases pull --project <slug> [--dir tests/]`: GET all cases (existing cursor
  endpoint), write canonical files, rewrite lock. `--force-server` skips the dirty check;
  otherwise refuse to overwrite files whose hash ≠ lock hash (local edits) — list them, exit 1.
- `testforge cases status`: three-column report per case — `local` (file vs lock), `server`
  (server rev vs lock rev), verdict (`clean | push | pull | CONFLICT | new-local | deleted-remote`).
  Exit 0 always (it's informational).
- `testforge cases push`: classic 3-way — for each case: local-only change → include in sync
  batch; server-only → leave (report "will pull"); **both** → conflict (report field-level:
  compare title/suite/priority/tags/steps separately; steps compare index-wise like
  `CaseHistory.tsx`), exit 1 unless `--force-local` (push anyway) or `--force-server`
  (re-pull those). New files (no id) always push; cases deleted on the server → report,
  never auto-delete local. After a successful push, update the lock with returned revs and
  write back assigned ids into the YAML files.

##### 3. Server endpoint (the only new server surface)

`POST /api/v1/projects/[slug]/cases/sync` — `guard(req, { write: true })`, §0.3. Body
`{ upserts: [{ displayId?: string, baseRev?: number, fields: {...} }] }`, max 500 per call.
Per item: no `displayId` → create (suite path auto-created like CSV import does);
with `displayId` → update **only if** `baseRev === current rev` (optimistic concurrency —
the server-side half of conflict safety), else that item returns
`{ status: "conflict", rev }` without writing. Every write goes through the existing case
create/update paths so F-05 revisions, audit (`case.sync`), and webhooks fire exactly as if
edited in the UI. Response items: `{ displayId, id, rev, status: "created"|"updated"|"conflict"|"unchanged" }`
("unchanged" when the payload equals current state — no revision spam from repeated pushes).
Add to OpenAPI + docs.

##### 4. Acceptance criteria (expands the brief's three)

1. pull → push with no edits → server records **zero** new revisions ("unchanged" path).
2. pull → edit title locally → push → pull is idempotent (second pull rewrites nothing).
3. Title edited both locally and on the server → push exits 1 naming the case + field; then
   `--force-local` wins, or `--force-server` restores; lock is consistent after either.
4. New YAML case → push assigns `TC-<SLUG>-<n>`, file renamed, id written into the file.
5. A batch with 1 conflicting + 4 clean items applies the 4 and reports the 1 (item-level
   atomicity, not all-or-nothing — CI-friendly).

##### 5. Test plan

e2e `e2e/cases-as-code.spec.ts` drives the CLI as a subprocess (F-12 e2e technique) in a temp
dir against the seeded project: pull → assert deterministic bytes (pull twice, diff empty) →
AC 2, 3, 4 flows via API-injected server edits.

#### L-04 — Real-time collaborative run execution `[x]`

**TestRail/Qase runs are single-player with refresh.** Make TestForge runs multiplayer.

- Transport: **SSE** (works on plain Next.js/node, no websocket infra):
  `GET /api/runs/[runId]/events` streams `{ type: "result"|"presence", ... }`; in-process
  pub/sub (`src/lib/run-events.ts`, an EventEmitter keyed by runId; document single-instance
  scope — multi-instance needs Redis later, out of scope).
- `RunExecutor.tsx`: subscribes; other users' result changes apply live (row flashes);
  presence avatars ("Ana is on TC-WEB-004") from a heartbeat every 20 s; soft claim — opening
  a case another person is on shows a warning chip, no hard lock; last-write-wins on conflict
  + toast "Overwritten by Ana just now (undo)" (undo = restore my value).
- AC: two browsers on one run see each other's avatars and statuses within 2 s; killing one
  browser removes its presence within 60 s; executor works unchanged when SSE fails (graceful
  degradation to current behavior).

> **Full work order — written 2026-07-13 by Fable 5.** The architecture (SSE + in-process
> pub/sub + soft claims + last-write-wins-with-undo) is final. The one invariant that must
> survive implementation: **the executor must be byte-identical in behavior when the stream
> is absent** — realtime is an overlay, never a dependency.

##### 1. Event bus — `src/lib/run-events.ts`

Module-scope `EventEmitter` stored on `globalThis.__tfRunEvents` (survives dev HMR; same trick
as Prisma's client singleton in `src/lib/db.ts`), `setMaxListeners(0)`, channel key = runId.
Exports `publishRunEvent(runId, evt)` / `subscribeRun(runId, fn) → unsubscribe`. Event union:

```ts
type RunEvent =
  | { type: "result"; resultId: string; caseId: string; datasetName: string | null;
      status: string; comment: string | null; elapsedSeconds: number | null;
      by: { id: string; name: string }; at: string }
  | { type: "presence"; users: { id: string; name: string; caseId: string | null; since: string }[] };
```

**Single-instance scope** is documented in a header comment: one Next.js process = one bus
(the Docker deploy is exactly that). Multi-instance would need Redis pub/sub behind the same
two exports — out of scope, noted for later.

Presence state lives in the same module: `Map<runId, Map<userId, {name, caseId, lastSeen}>>`.
A 30 s `setInterval` sweep drops entries with `lastSeen > 60 s` and publishes a fresh
`presence` snapshot for affected runs (also lazily on each heartbeat).

##### 2. HTTP surface (internal, not API-v1 — session auth only, like `/api/attachments`)

| Route | Behavior |
|---|---|
| `GET /api/runs/[runId]/events` | SSE stream. `requireSession`-equivalent via `getSession()` (401 JSON if none) + project-membership check (404 for non-members, F-01 rule). `ReadableStream`, headers `text/event-stream`, `Cache-Control: no-store`, `X-Accel-Buffering: no`. On connect: send current presence snapshot. Every 20 s send a `: ping` comment (keeps proxies from idling out). `export const dynamic = "force-dynamic"`, node runtime. Unsubscribe + clear interval on `req.signal` abort |
| `POST /api/runs/[runId]/presence` | Body `{ caseId: string \| null }`. Same auth. Upserts `{lastSeen: now}` and publishes a presence snapshot. Client heartbeats every 20 s + on case navigation; `navigator.sendBeacon` with `{ leave: true }` on `pagehide` deletes the entry immediately |

**Publish point**: at the end of `submitResult` (`src/app/actions/runs.ts:97`) after the DB
write + audit, `publishRunEvent(...)` with the writer's session identity. Fire-and-forget,
same discipline as `dispatchWebhook` (§0.4). Also publish from the API results-upsert route
and JUnit ingest (`by` = the API key's user) so automation uploads appear live too.

##### 3. `RunExecutor.tsx` client behavior

New hook `useRunChannel(runId)` encapsulating `EventSource` + heartbeat; the component renders
identically when it reports `connected: false` (initial render, SSE error, or
`typeof EventSource === "undefined"`). On error: close, retry with backoff 1 s → 2 s → 5 s →
give up after 5 failures (silent — no banner; degradation must be invisible, per AC).

- **Result events** (ignore own userId): patch the matching row's local state (status chip,
  comment, elapsed), flash the row (`bg-amber-50` fade 1.5 s, gated behind
  `prefers-reduced-motion` per §7.4.5).
- **Presence**: avatar stack in the run header (initials circles, ≤5 + "+n", tooltip
  "<name> — on <displayId>"); on the case list, a small initials dot on rows someone is
  viewing. Opening a case someone else is on → amber chip "Ana is on this case" (soft claim —
  informational, never blocking).
- **Conflict (last-write-wins + undo)**: if a `result` event lands for the case I have **open
  with a dirty form** (locally edited, unsubmitted) or one I submitted in the last 10 s, show
  a toast: `Overwritten by Ana just now — [Undo]` (§7.4.6 copy tone). Undo = resubmit **my**
  values via the normal `submitResult` action (which itself publishes — Ana then gets the
  mirror toast; symmetric, converges because humans stop). Toast auto-dismisses in 8 s;
  no queue — newest wins.

##### 4. Non-goals (pinned so nobody builds them)

No hard locks, no operational-transform/CRDT, no offline queue (that's F-36 D), no
cross-run global presence, no persistence of presence (restart = empty map, clients
repopulate on next heartbeat).

##### 5. Acceptance criteria (expands the brief's)

1. Two sessions, one run: A submits PASS → B's row updates + flashes within 2 s without
   refresh; B's presence avatar shows in A within 20 s of B opening the run.
2. Kill B's tab → B's avatar gone from A within 60 s (sweep) or instantly via beacon.
3. `EventSource` blocked (e2e: route-abort the events URL) → executor submits/navigates
   exactly as today; no console error spam (≤1 warn per retry, then silence after giving up).
4. A and B open the same case; A submits FAIL while B's form is dirty → B sees the
   overwrite toast; B's Undo restores B's status and A gets the mirror toast.
5. Non-member GET of the events URL → 404. Automation upload to the run appears live (AC 1
   path with the API as the writer).

##### 6. Test plan

e2e `e2e/realtime-run.spec.ts` with **two Playwright contexts** (two logged-in users, same
run) covering AC 1–4; AC 5 via a raw `request` call. SSE in Playwright needs no special
handling (it's just fetch); assert on DOM effects, not the wire format.

#### L-05 — One-file portable backup & restore `[x]`

> **Status: DONE** (2026-07-16, branch `feat/backup-restore`). Built from the Fable work order
> below. Five deviations, each in service of the work order's own goals — recorded here so the
> next reader doesn't think they were oversights:
>
> 1. **The engine is plain ESM** (`src/lib/backup-core.mjs`), not `backup.ts` alone. The work
>    order requires the CLI and the UI path to share `restoreBackup` — but a restore runs on a
>    *fresh production instance*, where there is no TS loader and no devDependencies, so a
>    `.mjs` core is the only shape that actually runs there. `backup.ts` is a typed wrapper over
>    it; `src/lib/crypto.ts` was likewise split into `crypto-core.mjs` + a re-export so the CLI
>    shares one implementation of the payload format (no call sites changed).
> 2. **`DATE_FIELDS` is derived from the Prisma DMMF**, not a hand-kept static map. Same goal
>    (ISO strings → `Date`), but a new DateTime column can never be missed. `MODEL_ORDER` stays
>    hand-written — FK order is semantic and genuinely cannot be derived — and is defended by
>    `scripts/backup-selfcheck.mjs` (AC 5), which runs in `prebuild`.
> 3. **`prismaSchemaHash` hashes the DMMF datamodel**, not the bytes of `prisma/schema.prisma`.
>    This schema is heavily commented; hashing the file would refuse every older backup after a
>    comment reflow ("backup is from schema X" — a lie). It also survives images that don't ship
>    the `.prisma` file. Structural changes still refuse, which is the actual requirement.
> 4. **`--force-wipe` erases via `deleteMany` in reverse `MODEL_ORDER` inside the import
>    transaction**, rather than shelling out to `prisma db push --force-reset` (decided with the
>    repo owner, 2026-07-16). The force-reset is not atomic with the import — a failure after it
>    leaves the instance both wiped and un-restored, the exact half-succeeded state this feature
>    exists to prevent. It also rebuilds the schema, which is redundant given guard 3. As a
>    transaction, a failed import rolls the old data back.
> 5. **The e2e restores into a separate "instance B" sqlite file**, instead of force-resetting
>    `dev.db` mid-suite as the test plan sketched. The whole suite shares one `dev.db` and one
>    dev server, so wiping it would destroy every other spec's fixtures. Instance B *is* the
>    work order's "clean instance B", and it lets AC 2's `--force-wipe` path be tested for real.
>
> **Known limitation (deliberate, matches the work order):** only `Integration` rows are
> deactivated on a `TF_SECRET` mismatch. `NotificationChannel.configJson` (F-08) is also
> encrypted, so SLACK/DISCORD/TEAMS channels restored under a different secret will fail at
> send time rather than being flagged. AC 3 says "nothing else lost", so widening the blast
> radius was left as a follow-up rather than changing the summary contract unilaterally.

**Self-hosting killer feature; nobody else has one-click full portability.**

- Settings → org (ADMIN): "Download backup" → streams a single `.tfbackup` file =
  zip of `db.json` (every table, keyed by model, FK-preserving export via Prisma) +
  `uploads/` files + `manifest.json` (schema version, app version, created at, row counts).
- "Restore" (fresh instances only: allowed while the DB has exactly 1 user and 0 projects, or
  via CLI `scripts/restore.mjs <file>`): validates manifest schema version ≤ current, imports
  in FK-safe order inside a transaction, rewrites nothing (cuids are globally unique).
- Complements `docs/SELF-HOSTED-MIGRATION.md` (link both ways). Passwords/API-key hashes are
  hashes already; `authEnc` secrets (F-07) are re-encryptable only if `TF_SECRET` matches —
  otherwise integrations are imported as `active: false` with a warning count in the restore
  summary. **Never include decrypted secrets in the backup.**
- AC: backup on instance A → restore on clean instance B → users can log in, cases/runs/
  attachments/badges all intact; restore on a non-empty instance is refused with a clear error.

> **Full work order — written 2026-07-13 by Fable 5.** The design constraint that shapes
> everything: a restore that half-succeeds is worse than one that refuses — every guard below
> favors refusal. Dependency decision (final): `adm-zip` for both create and restore
> (synchronous, in-memory; fine at this app's scale — attachment dedupe (F-01) keeps archives
> small; a size guard makes the limit explicit rather than discovered via OOM).

##### 1. Archive format (`.tfbackup` = zip)

```
manifest.json   { formatVersion: 1, appVersion, prismaSchemaHash, createdAt,
                  rowCounts: { [model]: n }, uploadsBytes, secretProbe }
db.json         { [modelName]: rows[] } — every model, raw column values, FK-preserving
uploads/<storageKey...>   every file under TF_UPLOAD_DIR
```

- `prismaSchemaHash` = sha256 of `prisma/schema.prisma` at build/export time; restore refuses
  on mismatch with "backup is from schema X, this instance runs Y — upgrade/downgrade first"
  (v1 rule: exact match only; migration-aware restore is a later formatVersion).
- `secretProbe` = `crypto.ts:encrypt("tfprobe")` — restore tries `decrypt`; success ⇒
  `TF_SECRET` matches ⇒ `Integration.authEnc` rows import as-is; failure ⇒ import with
  `active: false` and count them in the summary (`integrationsDeactivated: n`). Secrets are
  never decrypted during backup; the archive holds only what the DB already holds.
- Dates export as ISO strings; restore converts back via each model's Prisma schema (the
  script embeds a static `DATE_FIELDS` map generated by reading the schema — keep it next to
  `MODEL_ORDER` so schema PRs update both or fail the row-count self-check).

##### 2. Export — `src/lib/backup.ts` + `GET /api/admin/backup`

`buildBackup(): Promise<Buffer>` iterates `MODEL_ORDER` (FK-safe, the single constant both
sides import): `Organization, RoleDef, User, VerificationToken, Invitation, TwoFactorRecoveryCode?…,
Project, ProjectMember, Milestone, TestSuite, SharedStepGroup, ConfigGroup, ConfigOption,
Environment, CustomFieldDef, ResultStatusDef, TestCase, TestCaseRevision, TestPlan, TestRun,
TestRunResult, Comment, Attachment, SavedView, Dashboard, DashboardWidget, ShareLink,
ReportSchedule, Requirement, RequirementCase, Webhook, NotificationChannel, Integration,
IssueLink, ApiKey, AuditLog` (+ any model added later — a self-check compares
`Object.keys(Prisma.ModelName)` against `MODEL_ORDER` and **throws** on drift, so a schema PR
that forgets backup breaks CI, not a user's restore).

Route: org-ADMIN session only, streams the buffer as
`testforge-<org slug>-<YYYYMMDD-HHmm>.tfbackup`, audit `org.backup` (detail = total rows).
UI: "Backup & restore" card in org settings — download button + "Restore" explainer linking
`docs/SELF-HOSTED-MIGRATION.md` (both ways per the brief).

##### 3. Restore — `scripts/restore.mjs <file> [--yes]` + first-run UI path

Shared logic in `src/lib/backup.ts:restoreBackup(zip, opts)` so the script and the UI path
cannot drift:

1. **Guards (in order, all before any write):** manifest parses; `formatVersion <= 1`;
   `prismaSchemaHash` matches; target DB is *fresh* (≤1 user AND 0 projects — the UI path;
   the CLI additionally allows non-fresh only with `--force-wipe`, which runs
   `prisma db push --force-reset` first and **requires interactive confirmation or `--yes`** —
   consistent with the repo rule that force-reset needs explicit consent).
2. Import inside one `db.$transaction` in `MODEL_ORDER` (SQLite dev + Postgres both honor it);
   `createMany` per model in chunks of 500; cuids are globally unique so nothing is rewritten.
3. Copy `uploads/` into `TF_UPLOAD_DIR` (reject any zip entry whose normalized path escapes
   the root — same traversal rule as `storage.ts`).
4. Print/return a summary: rows per model, files copied, `integrationsDeactivated`, elapsed.
   Any thrown error ⇒ transaction rolls back ⇒ DB untouched (files may be partially copied —
   the summary's final line says so explicitly on failure; files without rows are inert).

**First-run UI restore** (the "fresh instance" path): the org-settings card shows an upload
form only while the freshness predicate holds. Upload cap `TF_MAX_RESTORE_MB` (default 512,
§0.7 rules). Audit `org.restore` on success.

##### 4. Acceptance criteria (expands the brief's)

1. Round trip A→B: login works (password hashes carried), attachments download byte-identical
   (sha256 spot-check in the e2e), badge tokens (L-01) still serve, run/report numbers match.
2. Non-empty target via UI → refused with the freshness error; CLI without `--force-wipe` →
   same; with `--force-wipe --yes` → wipes then restores.
3. Restore with a different `TF_SECRET` → completes; integrations imported `active: false`;
   summary counts them; nothing else lost.
4. Corrupted zip / truncated db.json / schema-hash mismatch → clean refusal, DB row counts
   unchanged (assert before/after).
5. Adding a Prisma model without updating `MODEL_ORDER` fails the self-check (unit script
   `scripts/backup-selfcheck.mjs`, run in CI before build).

##### 5. Test plan

e2e `e2e/backup-restore.spec.ts`: seed → download backup via authed request → reset DB
(existing force-reset consent env) → restore via `scripts/restore.mjs --yes` subprocess →
assert AC 1 spot checks. AC 4 with a deliberately truncated copy of the same archive.

---

### 7. Appendix — Fable design handoff (written 2026-07-13)

Fable 5 was the assigned model for the presentation-heavy work (F-35, F-36, L-01 visuals,
and Leapfrog polish). This appendix freezes the design system's *working vocabulary* so any
model can produce UI that is indistinguishable from the existing app. It documents what the
code already does — when in doubt, grep for the pattern and copy it.

#### 7.1 Tokens (source of truth: `tailwind.config.ts` + `src/app/globals.css`)

**F-39 (2026-07-27) tokenised this palette.** The flat list below is now historical —
every colour in the app resolves from the CSS-custom-property token layer in
`src/app/globals.css` (`:root` = light, `.dark` = dark), exposed as Tailwind colour
names (`bg-surface`, `text-content-muted`, `bg-accent-soft`, …) in `tailwind.config.ts`.
See the `#### F-39` entry in §8 below for the full token table (light **and** dark
values) and the class-rename map. New UI must use those semantic tokens, never a raw
`slate-*`/`indigo-*`/`bg-white` literal — enforced by `scripts/check-theme-tokens.mjs`
in CI. `ink` (`#1b1a22`) is the one exception: print output and `onColorOf()` only,
never themed.

| Token (pre-F-39, for history) | Value | Use |
|---|---|---|
| `ink` | `#1b1a22` | Print body text, high-contrast text on light |
| `accent` | `#4f46e5` (indigo-600-ish) | THE brand color: primary buttons, links, icon strokes |
| accent-soft | `rgba(79,70,229,.14)` | Icon fills (`.tf-acf`), mention chips |
| App background | `slate-50` | `<body>` |
| Card | `bg-white rounded-xl border border-slate-200 p-6` | Every content card, verbatim |
| Shell | `bg-slate-900 text-slate-300`, `w-60` fixed sidebar | Also PWA `theme_color` |
| Warning recipe | `bg-amber-50/-100` + `text-amber-800/900` | Preconditions box, stale-rev + queued chips |

#### 7.2 Typography (loaded in `src/app/layout.tsx` via next/font CSS variables)

- **Space Grotesk** = `--font-display` / `font-display`: h1–h3 only (globals.css applies it
  globally to headings with `letter-spacing: -0.01em`). Never for body.
- **IBM Plex Sans** = `--font-sans`: everything else. The app's default density is
  **`text-sm` (14px) slate** — body copy, tables, forms. `text-base` is the exception
  (mobile executor steps, marketing).
- **IBM Plex Mono** = `--font-mono`: display IDs (`TC-WEB-001`), counters (`12 / 40`),
  code, tiny uppercase meta labels.
- Print scale is its own thing — see F-35 §4 (10.5pt body, nothing lighter than slate-600).

#### 7.3 Component idioms (grep-and-copy patterns)

- **Chips/badges**: `rounded-full px-2 py-0.5 text-xs font-medium` + a pastel bg/text pair
  (`bg-amber-100 text-amber-800`, `bg-indigo-100 text-indigo-700`) or dynamic
  `style={badgeStyle(...)}` from `src/lib/result-statuses.ts` (F-14 — **always** use this
  for result statuses, never hardcode status colors).
- **Status glyphs**: `KEY_ICONS`/`KIND_ICONS` in `RunExecutor.tsx` (`✓ ✕ ⊘ → ↻ •`). Reuse
  the map; on any grayscale or high-glare surface the glyph carries meaning, color is a bonus.
- **Icons**: `TFIcon` in `src/components/icons.tsx` — 24-box outline SVGs; accent parts
  class `tf-ac` (stroke) / `tf-acf` (soft fill); variants `tf-current` (inherits color, for
  the dark sidebar) and `tf-onaccent`. New icons follow this anatomy — no icon libraries.
- **Markdown**: render through `src/components/Markdown.tsx` → styled by the `.tf-markdown`
  block in globals.css. New surfaces restyle via a scoped override (like F-35's print.css),
  never by editing the base block.
- **Testability**: interactive/statesful elements get `data-testid` kebab-case names
  (`queued-chip`, `dataset-chip`) — the e2e suite depends on them.
- **Theme switcher**: `ThemeSwitcher` in `src/components/ThemeSwitcher.tsx` (F-39) — a
  three-way Light/System/Dark segmented control, `size="sm"|"md"` and `tone="light"|"dark"`
  props. Copy this for any future control that needs to read/write the `tf_theme` cookie.

#### 7.4 Design judgment rules (the taste, encoded)

1. **Dense, quiet, functional.** No gradients, no shadows heavier than the browser default,
   no decorative illustration inside the app. The brand lives in the two typefaces, the one
   accent, and the icon system.
2. **One accent.** If a design wants a second brand color, it's wrong. Semantic colors
   (status, warning) come from the F-14 defs and the amber recipe only.
3. **State must be legible without color** (glyph, outline, label) — for print, sunlight,
   grayscale, and color-blind users alike.
4. **Touch**: ≥ 44 px targets, 52 px for primary actions; destructive/mutating actions are
   taps, never gestures (F-36 D's swipe-never-submits rule generalizes).
5. **Motion**: 150–200 ms ease-out, translate/opacity only, always gated behind
   `prefers-reduced-motion`.
6. **Copy tone**: short, concrete, names the actor ("Overwrote Ana's …"), reassures during
   uncertainty ("queued — will sync when online"). No exclamation marks in the app.

#### 7.5 Handoff status

With F-35 and F-36 now specified to implementation depth and this appendix in place, the
formerly-Fable backlog (F-35, F-36, L-01) is **executable by Opus 4.8** — the remaining
Leapfrog items' visual surface is small (L-04's presence chips/toast follow §7.3–7.4 as-is).

**Update 2026-07-13 (second handoff pass):** F-20, L-02, L-03, L-04, and L-05 now carry full
Fable-written work orders inline in their sections — architecture, security design, and every
judgment call are final. **The entire remaining backlog is now executable by Opus 4.8**
(Sonnet 5 for the mechanical P3 rows per §2); no feature still requires Fable. Sequencing
suggestion: F-20 and L-04 first (highest user value), L-02 + L-03 next (they share CLI
plumbing), L-05 and the P3 briefs as capacity allows. P3 briefs (F-25…F-34) stay briefs by
design — they follow established repo patterns and §0/§7 already encode everything
non-obvious about them.

---

### 8. Post-backlog features

Features specified after the original 42-item backlog was closed. Same Definition of Done, same
repo conventions; numbering continues from F-37.

#### F-38 — Public project sharing / portfolio mode `[x]`

> **Status: DONE** (2026-07-21, branch `feat/public-project-sharing`). Implemented as specified.

Make a whole project publicly viewable, read-only, without login — a public GitHub repo for test
design. Primary use case: a QA engineer showing their work to recruiters or clients. Distinct
from F-17 `ShareLink` (one entity behind an unguessable token) and L-01 `BadgeToken` (a single
number): this shares the **project**, under its **slug**, at `/public/<project-slug>`.

- `PublicShare { projectId @unique, enabled, showCases, indexable, createdById }` — one row per
  project (the `BadgeToken` shape). Overview is implicit when `enabled`; every other section is
  its own boolean column so future sections are additive columns, not a JSON blob.
- Routes live in their own group, **not** under `(app)`: `src/app/public/[slug]/{layout,page}.tsx`,
  `cases/page.tsx`, `cases/[caseId]/page.tsx`. No `requireSession()`, no `loadPerms()`, no server
  actions imported, no mutation of any kind, and no link into the app except the footer
  "Built with TestForge" CTA to `/login`.
- **One gate helper** is the security choke point: `src/lib/public-share.ts` —
  `requirePublicProject(slug)` (404s unless a row exists with `enabled`), `requireSection(project,
  "cases")` (404s when the toggle is off), `publicMetadata()`. A disabled share is
  indistinguishable from a project that never existed. The case detail query is always re-scoped
  with `projectId`, so a case id from another project 404s rather than leaking.
- Overview shows name, description, case/suite counts, last-updated, and the L-01 quality badge
  when the project has an active one. Cases list reuses the presentation-only `SuiteFolderGrid`
  and renders its own lean table (`CasesTable` is a client component wired to the bulk-edit
  server actions), with `?suite=`, `?q=`, and server-side `?page=`/`?per=` pagination.
- **Never exposed on any public page:** comments, attachments, custom fields, members, individual
  run results, defects, requirements, milestones, sessions, integrations, webhooks, audit log,
  revision history, automation/CI config, saved views, AI features. (Aggregate run/report data
  became opt-in in Part B below; nothing on this list moved.)
- SEO: `generateMetadata` per page with OpenGraph tags so the link unfurls on LinkedIn/X;
  `robots: noindex, nofollow` **by default**, flipped only by the per-project `indexable` toggle.
- Owner UI: Settings → **Public sharing** (`/projects/<slug>/sharing`) — master toggle with an
  explicit "the URL is your slug, therefore guessable" warning, the Test Cases section toggle,
  the indexing toggle, the copy-able public URL and a preview link. Actions in
  `src/app/actions/public-share.ts` all re-check `project.admin` server-side and write an
  `AuditLog` entry on enable, disable, section change, and indexable change. They also
  `revalidatePath('/public/<slug>', 'layout')` — the public pages are ISR-cached
  (`revalidate = 60`), so turning sharing off has to purge them.
- e2e `e2e/public-share.spec.ts` (TC-E2E-80) drives the whole thing from a genuinely
  unauthenticated `browser.newContext()`.
- **Deferred, deliberately:** unlisted (token) mode alongside the slug, a public Requirements
  section, a separate public README field, a sitemap for indexable projects, per-suite partial
  sharing, and rate limiting on the public routes. (Runs/Reports shipped in Part B.)

#### F-38 Part B — public Runs & Reports sections `[x]`

> **Status: DONE** (2026-07-27). Lifts the "public Runs/Reports sections" deferral above.

Two more `PublicShare` columns, `showRuns` and `showReports`, feeding
`src/app/public/[slug]/{runs,reports}/page.tsx` through the same
`requirePublicProject` → `requireSection` gate. Design constraints, all load-bearing:

- **Both default `false`** in the schema, not `true`. Shares already existed when these columns
  were added; a `true` default would have published execution history on every already-public
  project without its owner ever choosing to. Owners tick them in Settings → Public sharing,
  where each checkbox spells out what it shows *and* what it never shares.
- **`src/lib/public-runs.ts` is the field allow-list** and the second choke point after
  `public-share.ts`. The authenticated pages load runs with `include: { results: true }`; the
  public pages may not, so this module selects column by column and documents each omission.
  Excluded: `TestRunResult.{comment,defectUrl,customJson,assigneeId,elapsedSeconds,datasetName}`
  (tester notes, JUnit failure text, tracker links, per-project custom fields, who tested what),
  `TestRun.{createdById,description,origin,environmentId,configJson,planId,milestoneId,baselineId}`
  (no person's name appears on any public page; `origin` is CI topology / contributor machines;
  `Environment.url` is an internal host). Attachments are never joined at all.
- **There is no public run *detail* route.** The Runs section is a list of names, dates, statuses
  and status-bar tallies — per-result data has no page to leak from, by construction.
- **Reports is aggregates only:** pass rate, executions, failures, automation coverage, per-run
  trend, flaky tests. The muted-tests panel (free-text `mutedReason`, plus mute/unmute mutations)
  and bug correlation (built from `defectUrl`) are not ported.
- **Cross-section leak guard:** flaky tests are the one report that would name individual cases,
  so `loadPublicReport(projectId, withCaseTitles)` takes the project's `showCases` flag and
  degrades to a bare count when Test Cases is off. Publishing Reports can never become a side
  channel for a case catalogue the owner kept private.
- `updatePublicShare` writes one `public_share.sections` audit line per save that moved any
  section, recording the new state of all three — the question it answers is "what was public
  at time T".
- e2e: TC-E2E-80 grew a seeded run whose result carries a planted comment and a planted internal
  Jira URL, then asserts the raw HTML of both public pages contains neither, nor the run author's
  name, nor the account email, nor the CI origin, nor the run description.

#### F-39 — Light / dark theme `[x]`

> **Status: DONE** (2026-07-27, branch `feat/theme-light-dark`). Implemented as specified.

Lets a user put the entire TestForge UI into Light, Dark, or System (follows the OS), and
have that choice stick — across the in-app shell, the landing page, auth pages, and public
share pages. **Cookie-only** (`tf_theme`, values `light`/`dark`/`system`, `path=/`,
`max-age=31536000`), mirroring the existing `tf_lang` cookie exactly — no DB column, no
migration, because it must work logged-out on the landing/login/public-share pages where
there is no user row to write to.

**Resolution flow** — an inline `<head>` script (`src/lib/theme.ts`'s
`THEME_BOOT_SCRIPT`, wired into `src/app/layout.tsx`) runs before first paint, so there is
no flash of the wrong theme either way:

```
tf_theme cookie ─┬─ "light"  ──────────────────────────────► <html>            (no class)
                 ├─ "dark"   ──────────────────────────────► <html class="dark">
                 └─ "system" / absent ─► matchMedia(prefers-color-scheme: dark)
                                          ├─ true  ────────► <html class="dark">
                                          └─ false ────────► <html>            (no class)
```

It is deliberately **not** server-rendered from `cookies()` — that would opt the whole
app, including the static landing page, into dynamic rendering. `<html>` also carries
`data-theme-pref="light|dark|system"` so `ThemeSwitcher` (`src/components/ThemeSwitcher.tsx`)
can render its active segment without a hydration mismatch, and an OS-change listener
follows the device when the preference is "system". Placed in the sidebar footer
(`size="sm"`, `tone="dark"`), Settings → Account → Appearance (`size="md"`, above Profile),
and the landing + public-share headers.

**Token layer** — Tailwind's `darkMode` is now `"class"` (was the `media` default).
Every colour in the app resolves from CSS custom properties in `src/app/globals.css`
(`:root` = light, `.dark` = dark, stored as space-separated RGB channels so Tailwind's
`bg-x/50` opacity modifiers keep working via `rgb(var(--tf-x) / <alpha-value>)`), exposed
as Tailwind colour names in `tailwind.config.ts`. The **light column is byte-for-byte the
palette the app used before F-39** — light mode is pixel-identical modulo the two accepted
deviations below.

| Token | Light | Dark | Tailwind class |
|---|---|---|---|
| `--tf-canvas` | `248 250 252` | `2 6 23` | `bg-canvas` |
| `--tf-surface` | `255 255 255` | `15 23 42` | `bg-surface` |
| `--tf-surface-muted` | `241 245 249` | `30 41 59` | `bg-surface-muted` |
| `--tf-surface-raised` | `255 255 255` | `30 41 59` | `bg-surface-raised` |
| `--tf-text-strong` | `15 23 42` | `241 245 249` | `text-content-strong` |
| `--tf-text` | `51 65 85` | `203 213 225` | `text-content` |
| `--tf-text-muted` | `100 116 139` | `148 163 184` | `text-content-muted` |
| `--tf-text-subtle` | `148 163 184` | `120 137 160` | `text-content-subtle` |
| `--tf-border-subtle` | `241 245 249` | `30 41 59` | `border-hairline-subtle` |
| `--tf-border` | `226 232 240` | `51 65 85` | `border-hairline` |
| `--tf-border-strong` | `203 213 225` | `71 85 105` | `border-hairline-strong` |
| `--tf-accent` | `79 70 229` | `99 102 241` | `bg-accent` `text-accent` |
| `--tf-accent-hover` | `67 56 202` | `79 70 229` | `bg-accent-hover` |
| `--tf-accent-fg` | `255 255 255` | `255 255 255` | `text-accent-fg` |
| `--tf-accent-text` | `79 70 229` | `165 180 252` | `text-accent-text` |
| `--tf-accent-soft` | `238 242 255` | `30 32 82` | `bg-accent-soft` |
| `--tf-accent-soft-fg` | `67 56 202` | `199 210 254` | `text-accent-soft-fg` |
| `--tf-accent-ring` | `99 102 241` | `129 140 248` | `ring-accent-ring` |
| `--tf-sidebar` | `15 23 42` | `2 6 23` | `bg-sidebar` |
| `--tf-sidebar-fg` | `203 213 225` | `203 213 225` | `text-sidebar-fg` |
| `--tf-sidebar-hover` | `30 41 59` | `15 23 42` | `bg-sidebar-hover` |
| `--tf-sidebar-border` | `30 41 59` | `30 41 59` | `border-sidebar-border` |
| `--tf-danger` | `220 38 38` | `248 113 113` | `text-danger` `bg-danger` |
| `--tf-danger-soft` | `254 242 242` | `69 20 20` | `bg-danger-soft` |
| `--tf-danger-soft-fg` | `185 28 28` | `252 165 165` | `text-danger-soft-fg` |
| `--tf-danger-border` | `254 202 202` | `127 29 29` | `border-danger-border` |
| `--tf-warning` | `217 119 6` | `251 191 36` | `text-warning` `bg-warning` |
| `--tf-warning-soft` | `254 243 199` | `69 39 6` | `bg-warning-soft` |
| `--tf-warning-soft-fg` | `146 64 14` | `253 230 138` | `text-warning-soft-fg` |
| `--tf-warning-border` | `253 230 138` | `120 53 15` | `border-warning-border` |
| `--tf-success` | `22 163 74` | `74 222 128` | `text-success` `bg-success` |
| `--tf-success-soft` | `220 252 231` | `5 46 22` | `bg-success-soft` |
| `--tf-success-soft-fg` | `21 128 61` | `134 239 172` | `text-success-soft-fg` |
| `--tf-success-border` | `187 247 208` | `20 83 45` | `border-success-border` |
| `--tf-info` | `37 99 235` | `96 165 250` | `text-info` `bg-info` |
| `--tf-info-soft` | `219 234 254` | `23 37 84` | `bg-info-soft` |
| `--tf-info-soft-fg` | `29 78 216` | `147 197 253` | `text-info-soft-fg` |
| `--tf-info-border` | `191 219 254` | `30 58 138` | `border-info-border` |

`--tf-text-subtle`'s dark value was tuned from the originally-specified `100 116 139` to
`120 137 160` after the §8.3 contrast pass measured 3.75:1 against `--tf-surface` dark
(fails WCAG AA 4.5:1 for body text) — `120 137 160` clears 5:1. Every other pairing passed
on first measurement. The **sidebar stays a fixed dark surface in both themes** (D8) —
darker than the content area in dark mode — and role badges, status pills, and other
multi-hue chips that predate F-39 (`RoleBadge` in `ProjectMembersManager`/`TeamManager`,
`STATUS_BADGES`/`PRIORITY_BADGES`/etc. in `src/lib/constants.ts` and `src/lib/defects.ts`)
were remapped onto this same five-hue token set (accent/info/success/warning/danger) since
there is deliberately no second brand hue (§7.4.2).

**Two accepted light-mode deviations**, both documented at the call site:
- Status chips (`badgeStyle()` in `src/lib/result-statuses.ts`) now mix the status hex
  against the live `--tf-surface`/`--tf-text-strong` tokens via CSS `color-mix()` instead
  of assuming a white page — the only way one implementation is correct in both themes.
  This darkens light-mode chip text by a barely perceptible amount.
- The Tailwind `ringOffsetColor` default changed from white to `rgb(var(--tf-surface))`
  so dark-mode focus rings aren't haloed in white; in light mode the offset colour is
  white either way, so no visible change.

**Print stays light, unconditionally** (§7.6) — `src/app/print/print.css`'s `.tf-print-doc`
re-declares the light token values and `color-scheme: light` on its own root, so a user
reading in dark mode still previews and prints a white page. The 21 pre-existing hardcoded
hex values in that file were left exactly as they were.

**Regression guard**: `scripts/check-theme-tokens.mjs` (`npm run check:theme`, wired into
`.github/workflows/ci.yml` before the build step) walks `src/**/*.tsx` and fails the build
on any raw Tailwind palette colour, `bg-white`, or a `dark:` variant — the mechanism that
keeps the next feature from reintroducing a hardcoded colour and rotting dark mode. New UI
must use the semantic tokens above; if none fits, add one here rather than reaching for a
raw Tailwind colour.

**Testing**: `e2e/theme.spec.ts` (9 cases — default/system resolution, first-paint dark
cookie, switcher toggle without reload, persistence across reload/navigation, OS
`prefers-color-scheme` following and override, print staying light, the logged-out landing
switcher, and a no-flash check on `document.body`'s computed background). The full existing
suite was re-run afterward; five pre-existing specs asserted on the old literal Tailwind
class names as selectors (`bg-red-100`, `bg-indigo-600`, etc.) and were updated to the new
token classes — exactly the kind of break §8.2 of the work order anticipated, not a
behavioural regression.

**One incidental fix surfaced during testing**: the in-app sidebar's nav list had no
`overflow-y-auto`, so with enough seeded/active projects its content could push the footer
(Logout, and now the theme switcher) below the fixed-height sidebar with no way to scroll
to it. Fixed in `src/app/(app)/layout.tsx` by giving the `<nav>` its own scroll region
(`min-h-0 flex-1 overflow-y-auto`) while the logo header and footer stay pinned.

**Follow-up (2026-07-27):** `ThemeSwitcher` got a sliding active-segment indicator instead
of an instant colour swap — an absolutely-positioned pill (`width`/`height` = the segment's
own box size, `transform: translateX(index * boxSize)`) animates behind the icons on
`motion-safe:transition-transform motion-safe:duration-panel motion-safe:ease-tf-out`
(200ms, the repo's own ease-out curve), with the icon/label colour crossfading on
`duration-fast` (150ms) alongside it. Gated on `motion-safe:` so `prefers-reduced-motion`
gets an instant jump, same convention as every other transition in the app.

**Deferred, deliberately:** per-project/per-organisation theming, a high-contrast theme,
and dark-mode screenshots in the help centre (`docs/images/*` stay light-mode captures;
out of scope per §7.10).

#### F-40 — SEO hardening (canonicals, structured data, crawl hygiene) `[x]`

> **Status: DONE** (2026-07-30, branch `feat/seo-hardening`). Builds on HP-008, which shipped
> the basics (title/description/OG image/sitemap/robots.txt).

Everything a crawler reads now resolves from **one module**, `src/lib/seo.ts`: `SITE_URL` /
`absoluteUrl()`, `canonical(path)`, the `NOINDEX` and `INDEXABLE` robots constants, and the
JSON-LD builders. `src/components/JsonLd.tsx` renders a block (escaping every `<` to its JSON unicode
escape, so a FAQ answer or project description can never close the script tag early). No page hand-rolls an
absolute URL any more.

**1. Canonicals.** Every public page declares one (`alternates.canonical`), resolved against the
root layout's `metadataBase`: `/`, `/signup`, `/login`, `/terms`, `/privacy`, `/docs/api`,
`/docs/self-hosting`, `/docs/help`, `/docs/help/<topic>`. The public-share pages (F-38) get theirs
from `publicMetadata()`, which now takes a `path` — so `/cases`, `/runs`, `/reports` and each case
detail declare themselves canonical instead of all four sections collapsing onto the overview.

**2. Structured data** (`@graph`, one `<script>` per page, `@id`-linked):

| Page | Nodes |
|---|---|
| `/` | `Organization`, `WebSite`, `SoftwareApplication` (`offers.price: "0"`, MIT license, `featureList`), `FAQPage` |
| `/docs/help` | `BreadcrumbList`, `ItemList` of the nine topics |
| `/docs/help/<topic>` | `TechArticle`, `BreadcrumbList` |
| `/docs/self-hosting` | `TechArticle`, `BreadcrumbList` |

The `FAQPage` is generated **from the same i18n dict the `#faq` section renders** — Google's
rich-result policy requires the answers to be visible on the page, so it cannot be a separate copy
that drifts.

**3. Crawl hygiene.** `robots.txt` grew from four disallow entries to fifteen (adds `/my-work`,
`/print/`, `/share/`, `/invite/`, `/verify`, `/verify-email`, `/reset-password`,
`/forgot-password`, `/login/2fa`, `/offline`). robots.txt only asks a crawler not to *fetch*, so
every one of those routes also carries `robots: NOINDEX` in its own metadata — including a single
`export const metadata = { robots: NOINDEX }` on `src/app/(app)/layout.tsx` and
`src/app/print/layout.tsx`, which merges down over the whole authenticated shell so no in-app
route can be indexed by forgetting a tag.

**4. Sitemap.** Was six static URLs; now covers the help centre (nine topic pages that were
invisible to crawlers), `/docs/help`, `/docs/api`, and — the new dynamic half — every project whose
owner both published it *and* ticked `indexable` (`+ /cases` when that section is on). Shares with
`indexable: false` stay out: they already render noindex, and listing them would advertise URLs
their owners asked not to surface. The route is `force-dynamic` with the DB query in a `try/catch`
returning `[]`, so `next build` without a reachable database still emits the static half.

**5. Root metadata** gained `applicationName`, `keywords` (no ranking weight at Google; Bing and
several LLM crawlers still read them), `authors`/`creator`/`publisher`, `category`, site-wide
`openGraph` (`siteName`/`locale`/`url`) and `twitter` defaults, `robots: INDEXABLE`
(`max-image-preview: large` — the default `standard` shows a thumbnail instead of the full-width OG
image), and `formatDetection: { telephone: false }` so iOS Safari stops autolinking IDs like
`TC-WEB-001`. Note that Next merges metadata **shallowly**: a page-level `openGraph` replaces the
parent's entirely, so `siteName`/`locale`/`url` are repeated per page rather than inherited.

Pages that had a title but no description got one (`/terms`, `/privacy`), and each help topic now
uses its own `summary` — without it Google wrote the snippet from the first text on the page, which
for those pages is the sidebar nav.

**Testing.** `tsc --noEmit` + `next lint` clean. Verified against a running dev server: homepage
emits the four-node graph with six FAQ entries and a canonical, `/docs/help/automation` emits
`TechArticle` + `BreadcrumbList` with its own description, `/forgot-password` returns
`noindex, nofollow, nocache`, and `robots.txt`/`sitemap.xml` render the expanded lists. The DB half
of the sitemap is covered in `e2e/public-share.spec.ts` (TC-E2E-80): right after the indexable
toggle flips the robots meta, the spec now asserts `/public/<slug>` and `/public/<slug>/cases`
appear in `sitemap.xml`. `help-center`, `print-views`, `public-share`, `share-links`, `pwa-mobile`
and `smoke` specs re-run green.

**Deferred, deliberately:** HP-009 (analytics) is still backlog — this feature adds no third-party
script. `hreflang` alternates are not applicable: `tf_lang` is a cookie, so `en` and `id` share one
URL rather than living at `/en/…` and `/id/…`.

---

#### F-41 — Instance console: registered users (`/superadmin`) `[x]`

> **Status: DONE** (2026-07-31, branch `feat/superadmin-users`).

Until now nothing in the app could see across organizations, by design: Settings → Team is
`where: { organizationId: me.organizationId }`, and the only other cross-tenant query is the
`@mention` autocomplete. The person who *runs* the instance had no way to answer "who has signed
up?" short of opening the SQLite file on the VPS. F-41 gives them one page, and keeps the tenant
boundary intact everywhere else.

**The operator is not a `User`.** No row, no signup, no email, no password reset — a static
credential read from the environment (`src/lib/superadmin.ts`):

| Env | Meaning |
|---|---|
| `TF_SUPERADMIN_USER` | Username. Required. |
| `TF_SUPERADMIN_PASSWORD` | Plaintext. Rejected under **24 characters** — a static secret nobody rotates should not be guessable. |
| `TF_SUPERADMIN_PASSWORD_HASH` | bcrypt, preferred when your secret store handles `$` cleanly (Compose interpolation eats a bare `$`; escape it `$$`). Takes precedence over the plaintext var. |

Unset (or set with a too-short plaintext password, which logs a warning once) → `superadminEnabled()`
is false and **every `/superadmin` route 404s**, indistinguishable from a build without the feature.
Flipping it off also invalidates outstanding cookies immediately, since `getSuperadminSession()`
re-reads the config on every call.

**Session.** A separate `tf_superadmin` JWT cookie, `path=/superadmin`, 8 hours, httpOnly +
`secure` in production. It is signed with `AUTH_SECRET` like a normal session, so it also carries a
`purpose: "superadmin"` claim *and* re-checks the username against the current config — a valid
`tf_session` token replayed under the other cookie name verifies but fails both checks. The path
scope is why the CSV export lives at `/superadmin/export` rather than under `/api`: an `/api` route
would never receive the cookie.

**Login** (`src/app/actions/superadmin.ts`) uses the same in-memory lockout shape as the app's login
action — 5 failures per IP per 10 minutes — returns one generic "Invalid credentials." for both a
wrong username and a wrong password, and writes `instance.login` / `instance.login.failed` (with the
IP) to the audit log with a null `userId`.

**The page** (`/superadmin`) is read-only on purpose — member management stays where the permission
model lives, in the org admin UI. It shows four counters (users, email-verified, org admins,
organizations) and a table of every account: name + email, organization, role, project-membership
count, verified / 2FA status, signup time. Search (`?q=`) matches name or email — SQLite's `LIKE` is
case-insensitive for ASCII, so Prisma's `contains` needs no `mode`, which SQLite does not support —
and paging is 50/page. `Download CSV` streams the full list (`no-store`).

`robots.txt` disallows `/superadmin` and both pages carry `robots: NOINDEX`.

**Testing.** `tsc --noEmit`, `next lint` and `check:theme` clean. `e2e/superadmin.spec.ts`:
TC-E2E-81 walks signed-out redirect → wrong password → sign-in → cross-org list (the seeded org
admin *and* the org-less `Outsider`) → search → CSV 200 → sign out → CSV 401; TC-E2E-82 logs in as a
normal org ADMIN and confirms that session is still bounced to the console login and gets a 401 from
the export. The credential for the suite is set in `playwright.config.ts` → `webServer.command`.

**Deployment.** `TF_SUPERADMIN_USER` / `TF_SUPERADMIN_PASSWORD` are passed through in both compose
files, but the values live only in the VPS `/opt/testforge/.env` — which `deploy.yml` excludes from
its rsync, so they survive every deploy and never enter git.

---

#### F-42 — Public overview insight panels `[x]`

> **Status: DONE** (2026-08-02, branch `feat/public-overview-insights`).

The public overview (F-38) was four counters and three link rows: it proved a project *exists*
without saying anything about it. For the feature's primary audience — a QA engineer sending the
link to a recruiter or a client — that is the one page that has to land. F-42 turns it into a
summary of the project without opening a single new door.

**Panels, and the toggle each one belongs to.** The overview may never publish more than the
sections the owner turned on, so every panel is gated by the toggle that gates the page it
summarizes:

| Panel | Shows | Gate |
|---|---|---|
| Latest run | newest run's name, age, status bar, pass rate | `showRuns \|\| showReports` |
| Pass rate trend | sparkline over the last 12 runs + all-time rate | `showRuns \|\| showReports` |
| Run activity | GitHub-style 52-week heatmap of runs per day | `showRuns \|\| showReports` |
| Test design | priority distribution + case-type chips | `showCases` |
| Automation | % automated + automation-status distribution | `showCases` |
| Coverage tags | top 12 tags with case counts | `showCases` |

`showRuns || showReports` rather than `showRuns` alone: the Reports page already publishes the
per-run trend *with run names on the labels*, so a project sharing only Reports is not told
anything new by the execution panels. With both off they never load — the queries are behind the
same condition, not just the render.

**No new data path.** `src/lib/public-overview.ts` is aggregates only, and its execution half
calls `loadPublicRuns()` from `public-runs.ts` rather than querying `TestRun` itself — that module
is the documented field allow-list for anything run-shaped (F-38 Part B), and a second copy of it
is exactly the thing that goes stale. The design half is three `groupBy` queries plus the tag
column; no case body, no assignee, no custom field.

**Cross-section leak guard, same shape as the flaky panel.** Coverage tags is the one panel that
quotes the catalogue's own vocabulary, so it lives entirely inside the `showCases` branch: turning
Test Cases off removes the panel *and* the query. TC-E2E-80 asserts this with a tag string
(`expiry-guard`) planted so it appears nowhere else on the page.

**Presentation** is `src/components/PublicInsights.tsx` — server components, no client JS, no
`<form>` (the overview's "zero forms" assertion still holds). Colour classes live there rather than
in the lib because Tailwind's content scan covers `src/components` and `src/app` but not `src/lib`.
The activity grid is built in **UTC**: the public pages are ISR-cached and shared by every viewer,
so a server-local day boundary would mean nothing. `Last updated` now takes the newest run into
account too, and the section links became cards with a blurb.

**Testing.** `tsc --noEmit`, `next lint`, `check:theme` clean. TC-E2E-80 grew four checkpoints:
design panels present while execution panels are absent (and the run name nowhere in the HTML),
the execution panels appearing when Runs/Reports are switched on, the design panels *and* the tag
vanishing when Test Cases is switched off, and the overview added to the existing
"no comment / no defect URL / no author / no CI origin" raw-HTML leak sweep.

**Deferred, deliberately:** month labels on the activity grid, a per-suite coverage panel (suite
names are already one click away in the Test Cases section), and any client-side interactivity —
tooltips are `title` attributes so the page stays script-free.

#### F-43 — Mobile responsiveness audit `[x]`

> **Status: DONE** (2026-08-04, branch `feat/mobile-responsive-audit`).

F-36 made the *shell* and the *run executor* work on a phone, and stopped there by design — its
scope was the walking tester. Everything that tester touches before and after the run (the case
catalogue, reports, project settings) had never been looked at below 768px. F-43 audits every
route at 375×812 and fixes what it found. **No feature changes, no new UI** — layout only.

**Method: measured, not eyeballed.** A throwaway Playwright harness walked 54 authenticated
routes at 375×812 and recorded `documentElement.scrollWidth - clientWidth` per route. Reporting
the *elements* that overflow is close to useless — they're mostly innocent blocks inheriting a
width someone else forced. So the harness also computes each element's **min-content width** by
cloning it into a `width: min-content` probe, walks depth-first, and reports only the deepest node
that is still too wide. That names the actual culprit (a `<select>`, a `<pre>`, a nowrap row)
instead of its twelve ancestors. Two corrections were needed before the output was trustworthy:
descendant scroll containers are neutralised in the clone (otherwise the horizontally-scrolling
`ProjectTabs` strip is blamed on every page), and `overflow: hidden`/`auto` subtrees are skipped
(content there is contained by design).

**The rule applied everywhere: stack or scroll below `md` (768px), leave ≥`md` byte-identical.**
`md` is already the shell's drawer breakpoint (F-36), so nothing in the 768–1023px band moves and
there is no desktop regression to argue about.

**Baseline: 9 of 54 routes overflowed. Result: 0 of 54.**

| Route | Was | Root cause | Fix |
|---|---:|---|---|
| `/projects/[slug]` | 148px | `w-64` suite rail beside the case list left the list **63px wide**, and its table wrapper was `overflow-hidden` — the columns weren't scrollable, they were *invisible* | rail stacks below `md`; wrapper → `overflow-x-auto` |
| `/projects/[slug]/cases/[caseId]` | 213px | 4-button action row; dependency `<select>` sized to its widest option (`TC-… — <full title>`, ~470px) | header stacks below `md`; select → `w-full min-w-0` |
| `/projects/[slug]/fields` | 128px | two `flex-1` inputs + button in one row | `flex-wrap` + `min-w-0` |
| `/projects/[slug]/runs` | 103px | milestone name + date + button in one row | `flex-wrap` + `min-w-0` |
| `/projects/[slug]/reports` | 63px | trend chart columns can't shrink below their `100%` label (min-content 1717px with enough runs) | chart → `overflow-x-auto` |
| `/projects/[slug]/import` | 43px | 5 importer tab names in a non-scrolling row | same treatment as `ProjectTabs` |
| `/projects/[slug]/requirements` | 37px | refId + title inputs in one row | `flex-wrap` + `min-w-0` |
| `/projects/[slug]/api` | 18px | `white-space: pre` curl samples set the grid track's min-content | `min-w-0` on both grid children |
| `/` (landing) | 59px | logo + language + theme + CTA need ~450px | navbar `flex-wrap` |

**Three CSS traps worth writing down, because they will recur:**

1. **`min-w-0 truncate` on a flex child is not enough.** `truncate` sets `white-space: nowrap`, and
   Chrome still counts the full string in the row's min-content contribution; `min-width: 0` does
   not lower it. Pinning the width does: **`w-0 flex-1 truncate`**. This pattern appears in ~10
   list rows across the app and all of them were latent — only the two with long titles had tripped.
   **It only works when the parent is genuinely a flex container** — on a plain `<li>` the flex
   properties are ignored and `w-0` collapses the link to nothing. Two sites (`CaseDependencies`
   "Required by", `my-work` review list) are plain `<li>` and deliberately keep `min-w-0`.
2. **A grid track sizes to its items' min-content**, so one `<pre>` or `<select>` deep inside a
   grid child sets the whole column's width. `min-w-0` on the grid child is the release valve.
3. **`overflow-hidden` on a table wrapper is not a responsive fix** — it hides columns with no way
   to reach them. `overflow-x-auto` clips the rounded corners identically and scrolls. Every table
   wrapper in the app was converted; none contained an absolutely-positioned popover that the
   implied `overflow-y: auto` would have clipped (checked before changing each one).

**Testing.** The audit harness reports 0/54 routes overflowing (was 9/54); `tsc --noEmit`,
`check:theme`, and the full Playwright suite pass. Note for whoever runs the suite on Windows:
`playwright.config.ts`'s `webServer.command` uses POSIX `VAR=x cmd` env prefixes, which cmd.exe
rejects — start `next dev -p 3456` with those vars yourself and let `reuseExistingServer` pick it up.

**Deferred, deliberately:**

- **Touch-target sizing.** §7.4 asks for ≥44px targets and much of the app sits at 36–38px
  (`px-3 py-2 text-sm`). That is a density decision affecting every button on every surface, not a
  responsiveness bug — it belongs in its own change with its own review, not smuggled into a
  layout audit.
- **Collapsing the suite rail on `/projects/[slug]`.** Stacking fixed the breakage (the case list
  was 63px wide), but the rail is ~630px tall on a phone, so the cases table now starts below the
  fold. Making it a disclosure below `md` means inventing an interaction — open by default or not,
  does it remember state — and that is a design call, not a layout fix. Left as a deliberate,
  visible follow-up rather than decided in passing. **→ done in F-44.**
- `/print/*` (paper, not phones) and drag-to-reorder in the cases table (it has keyboard and menu
  equivalents; a touch DnD alternative is its own feature).

---

#### F-44 — Collapsible suite rail on the project overview `[x]`

> **Status: DONE** (2026-08-04, branch `feat/collapsible-suite-rail`). Closes the first deferred
> item in F-43 above.

F-43 stacked the suite rail above the case list below `md` because side by side left the list
63px wide. That fixed the overflow and created the next problem: the rail — suite tree, search,
Expand/Collapse all, `NewSuiteForm`, Shared Steps card — is **~630px tall on a phone**, so the
cases table opened most of a screen down. Below `md` the rail is now a disclosure, **collapsed by
default**: a 44px "Test Suites" header with a chevron, one tap to open.

**The two design calls F-43 declined to make in passing:**

1. **Collapsed by default, not open.** The table is the reason the route exists; the tree is
   navigation you reach for deliberately. Open-by-default would have reproduced the F-43 problem
   with an extra tap available to fix it.
2. **State is not persisted** (unlike `SuiteTree`'s own per-node collapse, which is in
   `localStorage`). Tapping a suite navigates, and arriving at the filtered cases with the rail
   shut is the wanted end state — a remembered "open" would drop the user below the fold on every
   navigation. Nothing to remember also means nothing to reconcile against the viewport on resize.

**Implementation.** `src/components/SuiteRail.tsx` — a client component owning one `useState` and
the `<aside>` itself; the page passes `SuiteTree` + `NewSuiteForm` as `children` (both are already
client components, so this is plain RSC composition, no prop re-plumbing). `<details>`/`<summary>`
was rejected: `open` is a DOM property, and there is no CSS that forces it open from `md` up.

**Keeping ≥`md` byte-identical** was the constraint, and it dictated the markup:

- The toggle (`md:hidden`) and the `<h3>` (`hidden md:block`) are **separate nodes**. One node
  styled to serve both would still be focusable and clickable on desktop, toggling state that the
  `md:` overrides then ignore.
- The toggle lives **inside** the card, not as a sibling of it in the `space-y-4` `<aside>`.
  Tailwind's `space-y-*` selector is `& > :not([hidden]) ~ :not([hidden])` — it keys on the
  `hidden` *attribute*, not the `hidden` *class*, so a `display:none` first child still makes the
  card the "second" child and would have pushed the whole rail down 16px on desktop.
- The panel carries `mt-3 md:mt-0`, so at `md` the `<h3>`'s `mb-3` is the only gap, exactly as
  before. Verified: rail box 256px wide, list starts to its right at the same `y`, card top flush
  with the rail top.

Chevron reuses `SuiteTree`'s glyph and rotates 90° over `duration-panel` (200ms) `ease-tf-out`
behind `motion-safe:` (§7.4.5); the header is `min-h-[44px]` (§7.4.4); `data-testid`
`suite-rail-toggle`, panel `id="suite-rail-panel"` wired via `aria-controls` + `aria-expanded`.

**Testing.** `e2e/responsive.spec.ts` — new **TC-E2E-86** (collapsed by default at 375px, one tap
opens the tree *and* the Shared Steps card, tap again closes, no overflow while open), and
TC-E2E-85 gained the no-leak-upward guard (at 1280px the toggle is absent and the panel, suite
search and Shared Steps are visible with no interaction — the component's own default is
"closed", so a broken `md:` override would blank the desktop rail).

**Not fixed here, and worth knowing.** The rail is no longer what keeps the cases table off the
first screen — `SuiteFolderGrid` is. Measured at 375px on the e2e fixture (8 root suites):
collapsed rail 78px, toolbar 228px, **folder grid 572px**, table top at y=1110. The grid is one
full-width card per suite and grows linearly with suite count; making it a compact list or a
2-column grid on phones is its own change against its own feature, not a rider on this one.

#### F-45 — Case toolbar layout on phones `[x]`

> **Status: DONE** (2026-08-04, branch `feat/mobile-toolbar-rows`). Reported from a screenshot:
> F-43 removed the toolbar's *overflow* but left its *appearance* bad.

Ten controls in one `flex flex-wrap items-center gap-2` row broke into a ragged six-line pile at
375px. Measured before: search stranded at its desktop `w-48` with a select crammed beside it,
`Filter` orphaned on its own line, and neighbours on the same visual row sitting at **y=415 vs
417** and **513 vs 516** — `items-center` centres each item within a wrap-line of mixed heights,
so nothing shared a baseline. Every line also ended at a different x.

**Two `display: contents` bands.** The toolbar is now an outer row containing two wrappers —
filters (Views + the filter form) and actions (review chip, Export, Print, Import, AI, + Test
Case). Below `md` each wrapper is a real flex container that can be styled; from `md` up both are
`display: contents`, so they vanish from layout and the desktop row is the same flat list of
children it has always been. **No DOM reordering**, so no `order` juggling was needed.

**Everything mobile-only is written as a `max-md:` override on top of the untouched original
classes**, rather than as a base rule with an `md:` counter-rule. This is the lesson from the
first attempt, which used `md:min-w-0` on the form: `min-width: 0` removed the min-content floor
that was holding a `flex-1` form open, and the search input collapsed from 192px to **51px** on
desktop. Additive `max-md:` rules make desktop identical by construction rather than by
re-derivation. Verified by stashing the change and diffing the measured desktop geometry —
identical to the pixel (bar 179px tall; search 192, priority 115, type 138, Views 230 at the same
x on both).

Alignment comes from `max-md:items-stretch` (one height per line) plus `max-md:[&>*]:grow` (each
line flush to both edges). Two children are wrappers whose *inner* button wouldn't stretch with
them, so the trigger is targeted directly —
`max-md:[&_[data-testid=saved-views-trigger]]:w-full` and the same for `export-menu-trigger`.
Targeted by testid rather than a structural `[&>div>button]`, which would also have hit the
buttons inside `AiGenerateCases`'s modal.

Result at 375px — every row flush 16→359, one height per row:

| Row | Contents |
|---|---|
| 1 | Views (full width) |
| 2 | Search (full width) |
| 3 | `All Priorities` · `All Types` · `Filter` |
| 4 | `Needs my review` · `Export ▾` |
| 5 | `Print view` · `Import` |
| 6 | `Generate with AI` · `+ Test Case` |

**Testing.** `e2e/responsive.spec.ts` **TC-E2E-87**: at 375px the search spans the toolbar width
and the two selects share the line below it; at 1280px the search is back to exactly 192px, which
is the guard that the `max-md:` rules never leak upward. Both dropdowns were opened at 375px to
confirm the now-full-width triggers still position their panels inside the viewport.

**Height is unchanged at 277px** — this was a raggedness fix, not a compaction. Making the
toolbar genuinely shorter on a phone means hiding rarely-used actions (Export/Print/Import) behind
a disclosure, which is the same "invent an interaction" call deferred in F-43/F-44 and belongs
with the `SuiteFolderGrid` work noted above.

#### A-01 … A-10 — TestForge QA Academy (in progress)

> **Full work-order detail lives in [`docs/QA-ACADEMY.md`](QA-ACADEMY.md)** — Academy is a
> subsystem delivered over several PRs rather than one feature (per that doc's header), so its
> `A-xx` numbering, curriculum, data model and per-PR "Delivered/Verified/deviations" writeups
> stay there. This entry is the one-line-per-PR pointer this section's convention asks for.

- **A-01** `[x]` (2026-08-10) — Academy shell: `/academy`, `/academy/[track]`,
  `/academy/[track]/[lesson]`, all public and prerendered; Track 1 (QA Fundamentals) written and
  published, 13 lessons.
- **A-02** `[x]` (2026-08-11) — Self-check quizzes: 39 questions, server-side grading, anonymous
  progress in `localStorage`, answer key never reaches the client bundle.
- **A-03** `[x]` (2026-08-11) — SEO (sitemap, `Course` JSON-LD) and entry points (landing nav,
  footer, app sidebar).
- **A-03b** `[x]` (2026-08-11) — Mobile entry points (a phone had none — the header nav is
  `hidden md:flex`) and beta labelling across every entry point.
- **A-04a** `[x]` (2026-08-11, [PR #158](https://github.com/mansyur007/testforge/pull/158)) — Academy
  sandbox: `Project.kind` (`NORMAL | ACADEMY_SANDBOX`), `ensureSandbox()`/`seedSandbox()`/
  `resetSandbox()`, the ShopMini fixture, and `NOT_SANDBOX` filtering the sandbox out of every
  surface that lists a learner's real work.
- **A-04b** `[x]` (2026-08-11, branch `feat/academy-coach`) — Coach overlay and the first five
  sandbox-task checkers (test case anatomy, boundary value analysis, equivalence partitioning,
  decision tables, bug reports). `AcademyCoach` docks over the real app (`?academy=<lessonSlug>`)
  and survives the redirect a saved case causes by mirroring the active exercise into
  `sessionStorage`, not just the URL. Checkers are pure functions in
  `src/lib/academy/checks-core.mjs` (plain ESM, unit-tested with no database by
  `scripts/academy-checks-selftest.mjs`, run in `prebuild`); `src/lib/academy/checks.ts` is the
  typed wrapper that fetches real sandbox rows and hands them to the matching function. "Mark done
  anyway" is always available — a checker that can't be talked past would make the grader bigger
  than the lesson. `e2e/academy.spec.ts` **TC-E2E-100** (bad submission → specific feedback, coach
  survives the case-save redirect; a second, complete submission → passes, lesson marked done) and
  **TC-E2E-101** (the defect-based checker, whose form doesn't redirect so `?academy=` survives on
  its own; "Mark done anyway" on an untouched exercise).
- **A-04b's one deviation:** the illustrative example in `docs/QA-ACADEMY.md` §6.2 named "the
  Checkout suite" for the boundary-value-analysis task; it ships against **Cart** instead, because
  that is where the fixture's own reference case for the same field already lives — and it keeps
  the BVA and "writing test cases" checkers scoped to different suites so neither can pass by
  reading the other's work.
- **A-05** `[x]` (2026-08-11, branch `feat/academy-persistence`) — Persistence: `LessonProgress`
  model, `/academy/me`, a dashboard "Continue learning" card. `localStorage` (A-02) becomes a
  local *cache* of the DB once a session exists rather than the record of truth;
  `claimAcademyProgress()` folds it in once, idempotently, on first authenticated load. Two real
  bugs surfaced by testing this against a browser rather than reading the logic: a promise cache
  that answered "not authed" forever once it had ever run anonymously (server actions redirect via
  Next's router, not a hard nav, so the module survives sign-in), and a claim-failure path that
  silently overwrote `localStorage` with the *pre-claim* DB snapshot — deleting the very progress
  that was waiting to be saved whenever the claim request itself got interrupted. `e2e/
  academy.spec.ts` **TC-E2E-102** (finish two lessons signed out, sign in as a fresh account, both
  already ticked; claiming again changes nothing — checked against a `LessonProgress.count()`, not
  just the UI) and **TC-E2E-103** (`/academy/me` and the dashboard widget). See `docs/QA-ACADEMY.md`
  § A-05 for the full account of both bugs and how they were actually found.
- **A-06** `[x]` (2026-08-11, branch `feat/academy-exam`) — Exam engine + ISTQB practice exam.
  `ExamAttempt` model; `src/lib/academy/exam-core.mjs` (pure — `drawQuestionIds`, `gradeAttempt`,
  `isLate` — unit-tested by `scripts/academy-exam-selftest.mjs` with no DB, run in `prebuild`) plus
  `src/lib/academy/exam.ts` (`server-only`, signs/verifies the start ticket with `jose`); a 72-
  question bank across six chapters (short of the plan's ≥300 target — tracked as content debt, see
  the deviation writeup) and the `ctfl-v4-full`/six `ctfl-v4-ch<n>` blueprints, all run by one
  `ExamRunner` UI (navigator, flag-for-review, countdown, confirm-submit, auto-submit at zero).
  Server-authoritative timer: `isLate()` takes no client-supplied elapsed time at all, so a
  tampered client clock has nothing to influence. Anonymous attempts grade inline with zero DB
  rows; signed-in attempts persist and redirect to `/academy/istqb/practice-exam/[attemptId]`,
  which is also what `/academy/me`'s new attempt history links to.
- **A-06's one deviation:** the route table's `[attemptId]` "session or signed ticket" auth
  resolved to session-only — an anonymous result renders inline on the exam page instead of
  navigating to a ticket-encoded URL, since there's no concrete need yet for an anonymous learner
  to revisit a result across page loads. `e2e/academy.spec.ts` **TC-E2E-105** (anonymous quiz:
  `ExamAttempt.count()` unchanged before/after, the literal acceptance criterion), **TC-E2E-106**
  (signed-in: persisted row, correct redirect, shows in attempt history), **TC-E2E-107** (full-exam
  blueprint on the start screen), **TC-E2E-108** (no answer key on the page before or during an
  attempt, checked against whichever questions the seed actually drew). See `docs/QA-ACADEMY.md`
  § A-06 for the full writeup, including a stale-session-cookie edge case found while manually
  walking the flow (pre-existing app-wide behaviour, not a regression, not fixed in this PR).
- **A-07 … A-08** `[ ]` not started — certificates, content build-out. See `docs/QA-ACADEMY.md` §8.
- **A-09** `[x]` (2026-08-12, branch `feat/academy-help-authed-shell`) — Session-aware shell on
  `/academy` and `/docs/help`: a signed-in visitor now gets the same sidebar/`AppShell` as the rest
  of the app (extracted into `src/components/AuthedAppShell.tsx`, reused by `(app)/layout.tsx`
  unchanged) instead of a disconnected-looking standalone page; a guest keeps the original public
  chrome with Log in/Sign up in place of "Back to app". SEO metadata is unaffected either way. Cost:
  both routes lost static prerendering (now `force-dynamic`, since they read the session cookie).
  `e2e/academy.spec.ts` **TC-E2E-109/110** and `e2e/help-center.spec.ts` **TC-E2E-111/112**. See
  `docs/QA-ACADEMY.md` § A-09 for the full writeup, including why the two pages couldn't just move
  into the `(app)` route group.
- **A-10** `[x]` code / `[ ]` content — exam integrity, opened 2026-08-12 from an audit of what A-06 actually
  shipped (measured against the real bank and the real `drawQuestionIds`, not against the docs).
  Three findings, one PR each: **A-10a** the answer key is `a` or `b` in 66 of 70 questions (`d` is
  never correct), so two of four options are dead on almost every question and noticing lifts a
  blind guess from 25% to ~47%, **fixed 2026-08-12** by shuffling each question's choices per
  attempt (`presentPaper` in `exam-core.mjs`) rather than rebalancing content by hand — which fixes
  every future question too, and avoids retroactively corrupting past attempts' review view; guarded
  by the new `scripts/academy-bank-check.mjs` (first-choice guessing: 26.0%, 0/300 papers passed)
  and **TC-E2E-114** for the wiring the script can't see, both proved to fail. The remaining content
  work (pools to 5x, multi-answer questions, K3 balance) split out as **A-10d** — plus chapter 5 holds 10
  questions against a blueprint weight of 9, giving two papers a 70% mean overlap, and there are no
  multi-answer questions at all despite a graded code path for them; **A-10b** exam start tickets
  are never marked used, so replaying one after reading the answer key off an empty submission mints
  a `passed` attempt — blocking for A-07, which issues certificates on a passing exam, **fixed
  2026-08-12** by `@@unique([userId, seed])` on `ExamAttempt` plus a conflict path that resolves to
  the existing attempt, guarded by **TC-E2E-113** (which replays the real server-action request off
  the wire, and was proved to fail with the index dropped); **A-10c** `ExamRunner` keeps the whole
  attempt in React state, so a reload mid-exam discards every answer along with the ticket that was
  the only way back into it, and the auto-submit retries once a second into a 20/min rate limit —
  **fixed 2026-08-12** (branch `feat/academy-a10c-resumable-attempts`) by mirroring the attempt into
  `sessionStorage` (`src/lib/academy/exam-session.ts`, re-sanitizing each question field by field on
  the way back in) and offering it back as a resume banner, plus an auto-submit that fires once and
  backs off 2s/6s/18s before handing over a manual **Submit now**; guarded by **TC-E2E-115** and
  **TC-E2E-116**, both proved to fail. A-10a also adds the selftest that would have caught the
  chapter-5 shortfall — the existing one runs against a synthetic 12-per-chapter bank, so it is blind
  to the real content. What is left under A-10 is **A-10d**, which is writing, not code. See
  `docs/QA-ACADEMY.md` § A-10.

---

*End of document. When a feature ships: tick its checkbox here, flip the cell in
[Part III — Competitive Comparison](#part-iii--competitive-comparison), and add the README line (§1 DoD).*
