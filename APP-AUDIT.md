# TestForge — Application Audit & User Flows

> Compiled 2026-06-14. Snapshot of `main` after migration to **OAuth-only auth**.
> For relaxed review — not for execution. Sections marked ⚠️ = items you should decide on/review.

---

## 1. Summary

TestForge = open-source **Test Case Management** platform (TestRail/Zephyr alternative).
- **Stack:** Next.js 14 (App Router) · React 18 · Prisma + SQLite (portable to Postgres) · Tailwind · JWT session (jose) · TypeScript.
- **Deploy:** Docker Compose on VPS `103.169.207.239`, fronted by Tokopudidi's Caddy stack, domain `testforge.emha.space`. Auto-deploy via GitHub Actions on push to `main`.
- **UI language:** bilingual (EN/ID) via `src/lib/i18n.ts` + cookie `tf_lang`.
- **Build status:** `tsc` ✅ · `next build` ✅ · OAuth route live & verified (307 → provider).

---

## 2. Authentication & Access Control

### Login/Signup — OAuth only (Google + GitHub)
- Single route handles initiate + callback: `src/app/api/auth/oauth/[provider]/route.ts`.
- Flow: button → redirect to provider (set CSRF `state` cookie, httpOnly) → callback validates `state` → exchange `code`→token → fetch profile/email → create user (`emailVerifiedAt` set immediately) → create session → redirect `/onboarding` (new user) or `/dashboard`.
- GitHub: fallback to fetch primary verified email when profile hides email.
- Session: JWT in `tf_session` cookie, httpOnly, 1 day (default) / 30 days. Set `rememberMe=true` for OAuth.

### Role / RBAC
- **Global user role:** `ADMIN | MEMBER | VIEWER`. **First user in DB becomes ADMIN automatically** (`userCount === 0`).
- **Per-project role (`ProjectMember`):** `OWNER | ADMIN | MEMBER | VIEWER`. Project creator becomes `OWNER`.
- **Enforcement:** `VIEWER` denied write access (create project/case/run). `requireSession()` guard in `(app)/layout.tsx` protects the entire app area (no `middleware.ts`; protection per layout/page).

### API for CI/CD
- API Key (Bearer) — stored as SHA-256 hash, only 8-char prefix displayed.
- `POST /api/v1/junit` — **requires** API key auth.
- `GET/POST /api/v1/projects/[slug]/cases` — accepts **session OR** API key.

⚠️ **Items for you to review (auth):**
1. **No password fallback.** If 4 OAuth env vars are wrong/expired → nobody can log in. No "break-glass" admin.
2. **First-login-becomes-admin.** On empty prod DB, whoever logs in first = ADMIN. Make sure you are first (already noted).
3. **Legacy admin seed** (`admin@testforge.local` + password) can no longer log in — demo data is orphaned.

---

## 3. Feature Inventory

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

## 4. User Flows (end-to-end)

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

## 5. Data Model (13 entities)

`User` · `Organization` · `Project` · `ProjectMember` · `Milestone` · `TestSuite` (recursive) · `TestCase` · `TestRun` · `TestRunResult` · `ApiKey` · `Invitation` · `VerificationToken` · `AuditLog`.

Important notes:
- `TestCase.seq` + `Project.caseCounter` → human-readable ID `TC-[SLUG]-[seq]`.
- `TestCase.deletedAt` → soft delete (queries always filter `deletedAt: null`).
- `User.organizationId` **nullable** → app runs without org.
- Cascade delete configured cleanly (delete project → suite/case/run/result deleted too).

---

## 6. ⚠️ Findings & Gaps for Review

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

## 7. Priority Suggestions (if continuing)

| Priority | Item | Reason |
|---|---|---|
| 🔴 High | Decide **org + team invite** strategy (§6.4–6.5) or hide invite step in onboarding | Feature is misleading today |
| 🟡 Medium | **Break-glass / guarantee at least 1 admin** | Avoid total lockout |
| 🟡 Medium | DB migration: drop `VerificationToken`, `passwordHash` nullable | Post-OAuth cleanup |
| 🟢 Low | Recycle bin for cases | Prevent data loss |
| 🟢 Low | Clean up dead i18n strings | Maintenance |

---
*End of audit. Enjoy lowering your cortisol — everything is committed & deployed, nothing hanging.* 🌿
