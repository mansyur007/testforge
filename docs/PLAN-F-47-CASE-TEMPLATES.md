# F-47 — Test Case Templates (curated starter library)

> ## ⚠️ TEMPORARY DOCUMENT — DELETE WHEN THE WORK IS FINISHED
>
> This is a working plan, not a permanent reference. When F-47 ships:
>
> 1. Append the finished-feature entry to `docs/DOCUMENTATION.md` (Part IV, after
>    `#### F-46`), following the format of the existing work orders.
> 2. Tick the README feature line and flip the `FEATURE-COMPARISON` cell (DoD §1.8).
> 3. **Delete this file** (`docs/PLAN-F-47-CASE-TEMPLATES.md`) in the same PR that
>    records the feature in `DOCUMENTATION.md`.
>
> Planned: 2026-09-01. Feature id `F-47` (next free — `F-46` is the last used, `F-48`
> appears in `DOCUMENTATION.md:3344` only as part of an unrelated case number).

---

## 1. Goal

A user who needs a login suite should not start from an empty tree and hand-write
thirty cases. They pick **Login & Authentication** from a template gallery, choose
where it lands, uncheck what they do not need, and get a populated suite tree in one
action.

The templates must teach good coverage, not just happy paths. Every pack ships
positive, negative, boundary, security, permission and usability cases, and the
preview screen shows that breakdown so the user can see what they are getting.

**Non-goal (deliberately out of scope for v1):** users saving their own suites as
reusable templates. The library is curated only. See §11.

---

## 2. Decisions already taken

Settled with the user before this plan was written:

| # | Question | Decision |
|---|---|---|
| D1 | Where does template content come from? | **Built-in curated library only.** No user "save as template" in v1. |
| D2 | Who can see a template? | **Global** — one shared library across the whole instance. Not per-organization. |
| D3 | Who authors them? | **Superadmin**, through a dedicated UI under `/superadmin`. |
| D4 | Where does applied content land? | **User picks the target suite** at apply time (project root, or inside an existing suite). |
| D5 | Can the user take only part of a template? | **Yes** — a preview screen with per-suite and per-case checkboxes. |
| D6 | How does superadmin author content? | **JSON/CSV import with a validated preview.** No nested form builder. |
| D7 | What ships in the initial library? | Login & Authentication, Registration & Onboarding, Generic CRUD, Checkout & Payment. |

---

## 3. What already exists (reuse, do not rebuild)

Findings from reading the codebase — these shape the plan and save real work.

### 3.1 `seedSandbox()` is the existing "apply a fixture to a project" code

[`src/lib/academy/sandbox.ts:56`](../src/lib/academy/sandbox.ts) already walks a
suite list, creates rows, maps suite names to ids, and creates cases pointing at
them. F-47's apply engine is a generalisation of this function: arbitrary tree
depth, an existing non-empty project, a selection filter and a target parent.

**It also contains a bug F-47 must not inherit.** `seedSandbox` finishes with:

```ts
data: { caseCounter: seq }
```

That is an absolute write, and it is only safe because a sandbox is provably empty
at that moment. Applying a template to a real project must **increment** the counter
atomically instead — see §6.3. Once F-47's engine exists, `seedSandbox` should be
reduced to a caller of it (§9, Phase 5) so there is one implementation, not two.

### 3.2 The content fixture pattern

`src/content/academy/sandbox.ts` holds the ShopMini fixture as typed data in the
repo, deliberately *not* in `prisma/seed.mjs`, because the production image ships no
seed script. The built-in template packs must live the same way — see §6.1 for why
this matters given how `/superadmin` is gated.

### 3.3 The data the engine writes into

- **`TestSuite`** (`schema.prisma:611`) — recursive via `parentId`, ordered by `order`.
- **`TestCase`** (`schema.prisma:625`) — `seq` is unique per project and renders as
  `TC-[SLUG]-[seq]`; steps live in `stepsJson` as `[{action, expected}]`
  (`InlineStep`, `src/lib/constants.ts:84`).
- Enums to validate against: `PRIORITIES`, `CASE_TYPES`, `CASE_FORM_STATUSES`
  (`src/lib/constants.ts:3-22`).
- Permission gate: **`case.write`** (`src/lib/permissions.ts:16`). Applying a template
  is bulk case creation and needs exactly that, nothing new.

### 3.4 `/superadmin` is read-only, env-gated, and dormant by default

`src/lib/superadmin.ts` is explicit: the console is not a `User` row, it authenticates
from `TF_SUPERADMIN_USER` + a password in env, and **every `/superadmin` route 404s
unless both are configured**. Today it has exactly one read-only page plus an export
route.

Two consequences that drive the design:

1. **The built-in library cannot depend on superadmin existing.** On an instance with
   no superadmin configured — which is the default — nobody could ever author a
   template. So the four launch packs ship as **repo content, seeded into the DB**,
   and the superadmin UI is an *editing overlay* on top, not the source of truth.
2. **F-47 introduces the first write path into `/superadmin`.** That is a genuine
   escalation of what that console can do. It needs its own auth guard on every
   mutation and an audit-log entry, and it must stay 404 when dormant. Called out
   again as a risk in §10.

---

## 4. Content model — coverage taxonomy

This is what makes the packs worth shipping. Every template case carries exactly one
coverage tag, emitted onto the created case as a real tag string so it survives into
the user's project and stays filterable with the existing tag filter.

| Tag | Meaning | Example (Login pack) |
|---|---|---|
| `coverage:positive` | The intended path works | Valid credentials sign the user in |
| `coverage:negative` | Invalid input is rejected correctly | Wrong password shows a generic error |
| `coverage:boundary` | Limits, off-by-one, empty, max length | Password at exactly the minimum length |
| `coverage:security` | Abuse, leakage, enumeration, injection | Error text does not reveal whether the email exists |
| `coverage:permission` | Role and ownership rules | Signed-out user hitting a protected URL is redirected |
| `coverage:usability` | State, feedback, accessibility | Caps-lock warning; loading state disables submit |
| `coverage:compatibility` | Environment variation | Session survives a browser restart when "remember me" is set |

**Rule for pack authors:** no suite may be positive-only. The preview screen renders
this distribution as a bar, which both sells the template and makes a thin pack
visibly thin.

---

## 5. The four launch packs

Target ≈ 30 cases each, ≈ 125 total. Each case ships `title`, `preconditions`,
`steps[]`, `expectedResult`, `priority`, `type`, and its coverage tag.

### 5.1 Login & Authentication (~34 cases)

| Suite | Cases | Coverage emphasis |
|---|--:|---|
| Login | 10 | positive, negative, boundary, usability |
| Session & Logout | 6 | positive, security, compatibility |
| Password Reset | 8 | positive, negative, security (token reuse, expiry) |
| Account Lockout | 5 | negative, boundary (n-th attempt), security |
| Two-Factor Authentication | 5 | positive, negative, security (recovery codes) |

Representative titles: *Sign in with valid credentials* (positive) · *Sign in with a
correct email and wrong password* (negative) · *Error message is identical for an
unknown email and a wrong password* (security — enumeration) · *Password field at
exactly the minimum length is accepted* (boundary) · *Reset link cannot be used twice*
(security) · *Account unlocks after the lockout window expires* (boundary) ·
*Submitting the form twice does not create two sessions* (negative).

### 5.2 Registration & Onboarding (~28 cases)

| Suite | Cases |
|---|--:|
| Sign-Up Form | 9 |
| Field Validation | 7 |
| Email Verification | 6 |
| Duplicate & Conflict | 3 |
| First-Run Onboarding | 3 |

Emphasis: field-level validation (boundary-heavy), verification-token security,
registering with an email that already exists, and abandoning onboarding halfway.

### 5.3 Generic CRUD (~30 cases)

Uses the `{{ENTITY}}` variable (§7) so *Create a {{ENTITY}}* renders as
*Create a Customer* when the user fills the field at apply time.

| Suite | Cases |
|---|--:|
| Create | 7 |
| Read & List | 6 |
| Update | 6 |
| Delete | 5 |
| Permissions & Access | 6 |

Emphasis: required-field and max-length boundaries, pagination edges (empty list,
one page, last page), concurrent edit, soft vs hard delete, and a full permission
matrix — the suite most teams forget.

### 5.4 Checkout & Payment (~32 cases)

| Suite | Cases |
|---|--:|
| Cart | 7 |
| Shipping & Address | 6 |
| Discounts & Promotions | 6 |
| Payment | 8 |
| Order Lifecycle & Refund | 5 |

Emphasis: quantity boundaries, free-shipping threshold at exactly the limit,
expired and malformed discount codes, declined and timed-out payments, double-charge
prevention, and invalid order state transitions.

---

## 6. Technical design

### 6.1 Data model (`prisma/schema.prisma`)

```prisma
// F-47: a curated starter pack of suites + cases a project can apply in one
// action. Global (no projectId, no organizationId) — one library per instance.
//
// The suite/case tree is a validated JSON blob rather than two normalised
// tables on purpose: a template is authored, previewed and applied as a whole,
// nothing ever queries across templates ("all template cases with priority
// HIGH"), and the authoring path is a JSON import (D6). Normalising it would
// buy nothing and cost two models plus a tree-assembly read on every preview.
// Only the counts the gallery card needs are denormalised out.
model CaseTemplate {
  id          String   @id @default(cuid())
  slug        String   @unique // "login-authentication" — stable, used in URLs
  name        String
  summary     String?  // one line, shown on the gallery card
  description String?  // Markdown, shown on the preview page
  category    String   @default("GENERAL") // AUTH | ONBOARDING | CRUD | COMMERCE | GENERAL
  contentJson String   @default("{}") // TemplateContent, see §6.2
  // Seeded from src/content/templates/**. Superadmin may edit and unpublish a
  // built-in but may not delete it: the next deploy would resurrect the row and
  // silently undo the deletion, which is worse than an explicit unpublish.
  builtIn     Boolean  @default(false)
  published   Boolean  @default(false) // drafts are invisible outside /superadmin
  version     Int      @default(1)     // bumped on every content edit
  suiteCount  Int      @default(0)     // denormalised for the gallery
  caseCount   Int      @default(0)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  applications TemplateApplication[]
}

// F-47: one row per apply. Powers the "you applied this on <date>" warning on
// the preview screen — the cheapest guard against a user silently duplicating
// 30 cases — and answers which packs are actually worth maintaining.
model TemplateApplication {
  id              String   @id @default(cuid())
  projectId       String
  templateId      String
  templateVersion Int
  targetSuiteId   String?  // null = project root
  suiteCount      Int
  caseCount       Int
  appliedById     String
  appliedAt       DateTime @default(now())

  project  Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  template CaseTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  appliedBy User        @relation("TemplateApplier", fields: [appliedById], references: [id])

  @@index([projectId])
}
```

Plus the back-relations on `Project` (`templateApplications`) and `User`
(`templateApplications TemplateApplication[] @relation("TemplateApplier")`).

`npx prisma db push` on an existing dev DB is additive here — two new tables, two new
optional back-relations, no column changes to existing models. No data loss.

### 6.2 Content schema (`src/lib/templates/schema.ts`)

```ts
export type TemplateVariable = {
  key: string;      // ^[A-Z][A-Z0-9_]{0,30}$ — referenced as {{KEY}}
  label: string;    // "Entity name"
  default: string;  // "Item"
};

export type TemplateCase = {
  key: string;      // stable id within the template, for the selection checkboxes
  title: string;
  coverage: Coverage;               // §4 — required, this is the point of the feature
  priority: Priority;               // PRIORITIES
  type: CaseType;                   // CASE_TYPES
  preconditions?: string;
  steps: { action: string; expected: string }[];  // InlineStep[]
  expectedResult?: string;
  tags?: string[];                  // extra tags beyond coverage:*
  estimateSeconds?: number;
};

export type TemplateSuite = {
  key: string;
  name: string;
  description?: string;
  suites?: TemplateSuite[];   // nested, max depth 3
  cases?: TemplateCase[];
};

export type TemplateContent = {
  variables?: TemplateVariable[];
  suites: TemplateSuite[];
};
```

One exported `parseTemplateContent(raw: unknown)` returning
`{ ok: true, content } | { ok: false, errors: string[] }`. It is the **only** way
content enters the DB — the superadmin import route, the seed script and the test
fixtures all go through it. Validation rules:

- `priority` ∈ `PRIORITIES`, `type` ∈ `CASE_TYPES`, `coverage` ∈ the §4 list.
- `key` unique within its level; suite nesting depth ≤ 3.
- Every `{{VAR}}` referenced in any string is declared in `variables`.
- Caps: ≤ 60 suites, ≤ 400 cases, ≤ 50 steps per case, ≤ 256 KB serialised.
  A template is a starter pack, not a bulk-import channel (`/api/import/cases`
  already exists for that), and an uncapped blob is a denial-of-service on the
  apply transaction.

### 6.3 The apply engine (`src/lib/templates/apply.ts`)

The core of the feature. Signature:

```ts
applyTemplate({
  projectId, template, targetSuiteId,
  selection: { suiteKeys: string[]; caseKeys: string[] },
  variables: Record<string, string>,
  status: "DRAFT" | "ACTIVE",   // what the created cases start as
  userId,
}): Promise<{ suiteIds: string[]; caseIds: string[] }>
```

Algorithm:

1. **Filter** the tree to the selection. A suite is created if it is selected *or* it
   is an ancestor of a selected case — otherwise a checked case could end up orphaned
   at the root.
2. **Substitute** `{{VAR}}` across `title`, `preconditions`, `expectedResult`, and
   each step's `action`/`expected`. Unfilled variables fall back to their default,
   never left as a literal `{{VAR}}` in the user's data.
3. **Resolve the target.** `targetSuiteId` must belong to this project (tenant guard)
   — a foreign id is a 404, not a 403.
4. **Allocate case numbers atomically.** This is the part `seedSandbox` gets wrong:

   ```ts
   const { caseCounter } = await tx.project.update({
     where: { id: projectId },
     data: { caseCounter: { increment: n } },
     select: { caseCounter: true },
   });
   const firstSeq = caseCounter - n + 1;   // [firstSeq … caseCounter] is ours
   ```

   The increment returns the post-update value, so the range is reserved before any
   case row is written. Two people applying templates at the same moment get
   disjoint ranges; an absolute write would collide on `@@unique([projectId, seq])`.
5. **Create rows** depth-first inside one `db.$transaction`, mapping template suite
   keys to real suite ids as it descends. `order` continues from the highest existing
   `order` under the target parent, so applied suites land after what is already there.
6. **Name collisions are allowed.** If the project already has a suite called "Login",
   a second one is created rather than merged. Silently merging into a suite the user
   did not choose is the more surprising outcome; the preview warns instead (§6.5).
7. **Write** the `TemplateApplication` row, an `AuditLog` entry
   (`template.apply`), and fire the `case.created` webhook batch.

Everything in one transaction: a template that half-applies leaves a tree the user
must clean up by hand.

### 6.4 Server actions & API

Following §0.2 (auth → RBAC → tenant guard → validate → mutate → audit → revalidate):

`src/app/actions/templates.ts`
- `applyTemplateAction(formData)` — gate `case.write`.

`src/app/actions/superadmin-templates.ts` — every action calls `requireSuperadmin()` first
- `createTemplateFromJson`, `updateTemplateContent`, `setTemplatePublished`,
  `deleteTemplate` (refuses when `builtIn`).

API v1 (per DoD §1.3 — serializers, cursor pagination, OpenAPI spec updated):
- `GET  /api/v1/templates` — published only; the gallery, and a CI-friendly listing.
- `GET  /api/v1/templates/[slug]` — full content for preview.
- `POST /api/v1/projects/[slug]/templates/[templateSlug]/apply` — body carries
  `targetSuiteId`, `selection`, `variables`, `status`. Gate `case.write`.

Webhooks (DoD §1.4): reuse the existing `case.created` event rather than minting a
`template.applied` one — consumers care that cases appeared, and a new event name is
a new contract to support forever.

### 6.5 UI

**Gallery — `/projects/[slug]/templates`**
Card grid: name, summary, category chip, "5 suites · 34 cases", and the coverage
distribution bar. Cards for already-applied templates carry a muted "Applied
<relative date>" line.

**Preview — `/projects/[slug]/templates/[templateSlug]`**
- Left: the suite/case tree with checkboxes (all checked by default; checking a suite
  toggles its cases; a case row shows its coverage chip and priority).
- Right, sticky: target suite picker (a "Project root" option plus the existing suite
  tree), the variables form (only when the template declares any), an initial-status
  radio (`DRAFT` recommended — a template is a starting point, not approved work),
  a live "will create N suites, M cases" count, and the Apply button.
- Warnings above the fold: "You applied this template on <date>" and "This project
  already has a suite named 'Login'".
- After apply: redirect to the created root suite in the cases view with a success
  toast, so the user sees their new tree immediately.

**Entry points** (a gallery nobody finds is a gallery nobody uses):
- Cases page empty state → "Start from a template".
- Suite rail (F-44) → "+" menu gains "From template".
- Project overview empty state → same link.

**Superadmin — `/superadmin/templates`**
Table (name, category, version, counts, published), a "New from JSON" screen with a
paste box that runs `parseTemplateContent` and renders either the error list or the
same preview tree the user sees, an edit screen for existing content, and
publish/unpublish toggles. Built-ins get no delete button.

Styling per DoD §1.5: Tailwind, `TFIcon`, table and form styles matched to
`CasesTable.tsx` / `CaseForm.tsx`.

### 6.6 Seeding the built-in packs

`src/content/templates/{login-auth,registration,crud,checkout}.ts` export typed
`TemplateContent` objects; `src/content/templates/index.ts` exports the array with
each pack's slug/name/category metadata.

`src/lib/templates/sync.ts` exports `syncBuiltInTemplates()` — upserts by `slug`,
sets `builtIn: true`, recomputes `suiteCount`/`caseCount`, and bumps `version` when
the content hash changed. Called from:
- `prisma/seed.mjs` (dev), and
- a lazy, cached call on the first request to the gallery, so **production instances
  get the library without a seed script** — the same constraint that put the
  ShopMini fixture in `src/content` (§3.2).

An unpublished built-in stays unpublished across a sync: the sync writes content, not
the `published` flag, so a superadmin's decision to hide a pack survives deploys.

---

## 7. Variables (`{{VAR}}`)

Small but high-value, and it is what makes the CRUD pack general instead of abstract.
A template declares its variables; the apply screen renders one text input each,
pre-filled with the default; substitution happens in the engine (§6.3 step 2).

Deliberately **not** reusing F-13 datasets (`datasetJson`, `TestCase` line 644).
Datasets parameterise a case at *execution* time and create one result row per row of
data. Template variables are resolved once at *creation* time and then gone. Same
`{{}}` syntax, different lifecycle — conflating them would make an applied case
behave as if it were parameterised.

---

## 8. Testing

**e2e — `e2e/templates.spec.ts`** (DoD §1.7), following the conventions in
`e2e/README.md`. Note the local caveat from prior sessions: `npm run e2e` cannot
start its own server on this machine — launch `next dev -p 3456` with the config's
env vars first.

| Case | Assertion |
|---|---|
| TC-E2E-1xx | Gallery lists the four built-in packs with non-zero counts |
| TC-E2E-1xx | Apply full template to project root → suite tree and case count match |
| TC-E2E-1xx | Apply with two suites unchecked → only the checked ones are created |
| TC-E2E-1xx | Apply into an existing suite → new suites are nested under it |
| TC-E2E-1xx | `{{ENTITY}}` = "Invoice" → created case titles read "Invoice", no `{{` remains |
| TC-E2E-1xx | Applying twice → warning shown, and the second apply gets a fresh `seq` range with no unique-constraint error |
| TC-E2E-1xx | A `VIEWER` sees the gallery but gets no Apply button, and the API returns 403 |

**Unit — `parseTemplateContent`**: rejects a bad priority, an undeclared `{{VAR}}`,
depth 4 nesting, and an over-cap case count. Cheap, and it is the boundary every
content path crosses.

**Manual:** `npx prisma db push` against a copy of an existing dev DB, then
`npm run build`.

---

## 9. Build order

Each phase is one PR, each leaves `main` green.

| Phase | Scope | Depends on |
|--:|---|---|
| 1 | Schema (two models), `parseTemplateContent` + unit tests, `syncBuiltInTemplates`, **one** pack (Login) as content | — |
| 2 | Apply engine + server action + API apply endpoint + audit + webhook | 1 |
| 3 | User-facing gallery, preview/selection UI, entry points | 2 |
| 4 | Remaining three packs (Registration, CRUD, Checkout) | 1 |
| 5 | Superadmin templates UI (list, import JSON, edit, publish) + `GET /api/v1/templates` + OpenAPI | 2 |
| 6 | Refactor `seedSandbox()` onto the apply engine; e2e spec; README + FEATURE-COMPARISON; **`DOCUMENTATION.md` entry + delete this file** | 3, 4, 5 |

Rough effort: phases 1–3 are the substance (the engine and the selection UI); phase 4
is content writing, not engineering, and is the bulk of the calendar time; phase 5 is
a small CRUD screen over an existing validator.

**Delivery note for phase 5.** That PR touches `/superadmin`, which by standing
instruction ships low-profile: bland title, empty PR body, disguised branch name, and
**merged manually by the user** — the auto-merge convention that applies to the other
phases does not apply to it. Phases 1–4 and 6 are ordinary PRs.

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| **Superadmin gains its first write path.** The console is currently read-only by design and authenticates from static env credentials. | `requireSuperadmin()` on every mutation; audit-log every write; routes stay 404 when dormant. Content is validated by `parseTemplateContent` before it can reach the DB — a superadmin cannot store a blob that breaks the apply engine for every user. |
| Built-in library invisible on instances with no superadmin configured (the default). | Packs seed from repo content, not from the console (§6.6). The console only edits. |
| Applying twice silently duplicates ~30 cases. | `TemplateApplication` row → explicit warning on the preview screen. Not blocked: re-applying after deleting a suite is legitimate. |
| `caseCounter` race on concurrent applies. | Atomic `increment` reserving a `seq` range inside the transaction (§6.3 step 4) — never the absolute write `seedSandbox` uses. |
| Suite name collisions with existing content. | Create rather than merge; warn in the preview. Merging into a suite the user did not pick is the more surprising failure. |
| A 400-case template locking the DB inside one transaction. | Hard caps in the validator (§6.2). SQLite in particular will not enjoy an unbounded batch. |
| Content quality — a pack that is thin or positive-only undercuts the whole feature. | Coverage tag is required per case; the preview renders the distribution, so a thin pack is visibly thin before anyone applies it. |
| Scope creep toward "save my suite as a template". | Explicitly deferred (§11). The schema does not block it — adding `organizationId` and `builtIn: false` later is additive. |

---

## 11. Deferred (record these, do not build them now)

- **User-authored templates** ("Save suite as template"). The `CaseTemplate` model
  takes a nullable `organizationId` later without touching applied data.
- **Per-organization private libraries** — follows directly from the above (D2 chose
  global for v1).
- **Import/export a template as a file** — `/api/import/cases` already covers bulk CSV;
  revisit only if users ask to share packs between instances.
- **Template versioning UX** — `version` is stored and stamped onto each application,
  but there is no "this template changed since you applied it" diff view.
- **Requirements, shared steps, custom fields inside a template.** Suites and cases
  only in v1; shared-step groups (F-04) are project-scoped and would need their own
  mapping pass.

---

## 12. Definition of Done (from `DOCUMENTATION.md` §1)

- [ ] Prisma schema updated; `db push` clean on a fresh DB **and** an existing dev DB;
      `prisma/seed.mjs` calls `syncBuiltInTemplates()`.
- [ ] Server actions follow §0.2 (auth → RBAC → tenant guard → validate → mutate →
      audit → revalidate).
- [ ] API v1 endpoints follow §0.3, with serializers and an updated OpenAPI spec.
- [ ] Webhooks: applied cases fire the existing `case.created` event.
- [ ] UI matches `CasesTable.tsx` / `CaseForm.tsx` conventions; `TFIcon` throughout.
- [ ] CSV import/export unaffected — F-47 adds no case *fields*, so no change needed.
      Confirm this explicitly rather than assuming it.
- [ ] `e2e/templates.spec.ts` covers the happy path and the selection path.
- [ ] `README.md` feature line added; `FEATURE-COMPARISON` cell flipped to ✅.
- [ ] `npm run build` passes.
- [ ] `DOCUMENTATION.md` gains the F-47 entry **and this file is deleted.**
