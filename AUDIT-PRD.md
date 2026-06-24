# TestForge PRD v1.0 Audit

Audit results for `TestForge_PRD_v1.0.docx` (June 2025). Overall this PRD is
**mature and above average**: competitor analysis, personas, user stories
with acceptance criteria, measurable NFRs, data model, and open source strategy.
However, the following **functional gaps, internal inconsistencies, and scope
risks** were found.

## 1. MISSING Features (needed but not in the PRD)

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

## 2. Internal PRD Inconsistencies

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

## 3. Scope Risks & Recommendations

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

## 4. Additional Audit: Section 11 (Homepage) & 12 (Register/Sign Up)

Audit for PRD revision adding homepage and auth specs
(`TestForge_PRD_v1.0 (1).docx`). Both sections are detailed and actionable
(ready-to-use copywriting, prioritized FRs). Findings:

### 4.1 New inconsistencies & gaps

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

### 4.2 Functional requirements status

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

## 5. Implemented in this MVP

All **P0** §7.1 items: projects (create/archive), full test case CRUD with all standard fields,
suite+section hierarchy, manual test run with execution + keyboard
shortcuts (US-002), basic auth + RBAC, REST API + API key. Plus **P1** items:
CSV import with preview/validation (US-004), CSV export, framework-agnostic JUnit XML upload
with auto-matching (US-010), run reports + flaky test +
bug correlation + automation coverage, and audit gap fixes #3, #6, #7
plus inconsistencies #1–#3.
