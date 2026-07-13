# TestForge — Feature TODO Specifications (Implementation Work Orders)

> **Purpose.** This document is the executable backlog for TestForge. Every feature below is
> written as a **self-contained work order**: exact data model, exact file paths, function
> signatures, API contracts, acceptance criteria, edge cases, and test plan. An implementer
> (human or AI agent) should be able to build any feature from its section alone, without
> asking questions.
>
> **Origin.** Gap analysis vs TestRail, Qase, TestLink, Test IO and others — see
> [FEATURE-COMPARISON.md](FEATURE-COMPARISON.md). The **Leapfrog** section (L-01…L-05)
> contains features designed to make TestForge *better* than every competitor, not just equal.
>
> Created: 2026-07-08. Status legend: `[ ]` not started · `[x]` shipped.

---

## Table of contents

- [0. Read this first: repo conventions every feature MUST follow](#0-read-this-first-repo-conventions-every-feature-must-follow)
- [1. Definition of Done (applies to every feature)](#1-definition-of-done-applies-to-every-feature)
- [2. Recommended build order & dependencies](#2-recommended-build-order--dependencies)
- [3. P1 features (F-01 … F-10) — full work orders](#3-p1-features)
- [4. P2 features (F-11 … F-24) — compact work orders](#4-p2-features)
- [5. P3 features (F-25 … F-36) — scoped briefs](#5-p3-features)
- [6. Leapfrog features (L-01 … L-05) — beat the competition](#6-leapfrog-features)

---

## 0. Read this first: repo conventions every feature MUST follow

The implementer must copy these existing patterns, not invent new ones.

### 0.1 Stack & layout

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

### 0.2 Mandatory server-action pattern

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

### 0.3 Mandatory API v1 pattern

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

### 0.4 Webhooks

New entity mutations should fire webhooks: add event names to `WEBHOOK_EVENTS` in
`src/lib/webhooks.ts` (format `entity.verb`), call `dispatchWebhook(projectId, event, data)`
after the DB write. Delivery is fire-and-forget; never await it in a way that blocks the response.

### 0.5 i18n

Public pages (landing/auth) are translated via `src/lib/i18n.ts` (cookie `tf_lang`, `en`/`id`).
**The internal app UI is English-only for now** — write all new app UI strings in English
directly; do not add app strings to `i18n.ts` unless the feature is on a public page.

### 0.6 Git & delivery rules (from README, non-negotiable)

- Never commit/push to `main`. Branch `feat/<slug>` → PR → CI green → merge (auto-deploys prod).
- Never commit `.env`, secrets, `*.db`. Minimal diff — do not refactor unrelated code.
- One feature (one `F-xx`) per branch/PR unless stated otherwise.

### 0.7 Environment variables

New env vars must: have a safe default for `docker compose up` zero-config startup, be added to
`docker-compose.yml` + `docker-compose.prod.yml` (commented), and be documented in `README.md`
and `docs/SELF-HOSTED-MIGRATION.md` if they affect data location.

### 0.8 Which model to use (for AI implementers)

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

## 1. Definition of Done (applies to every feature)

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

## 2. Recommended build order & dependencies

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
| — | L-01…L-05 leapfrog, interleaved | see each | Designed to beat competitors, not match them | **Fable 5** — these are net-new product design, not ports of a known feature |

---

## 3. P1 features

---

### F-01 — Attachments & file uploads `[x]`

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

#### Data model (add to `prisma/schema.prisma`)

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

#### Storage abstraction — new file `src/lib/storage.ts`

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

#### Rules & limits

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

#### Endpoints

| Method & path | Auth | Behavior |
|---|---|---|
| `POST /api/v1/projects/[slug]/attachments` | `guard(req, {write:true})` + project membership | `multipart/form-data` with fields `file`, `entityType`, `entityId`. Validates entity exists in this project. Returns `201` + `serializeAttachment(a)` |
| `GET /api/attachments/[id]` | session or Bearer, membership | Streams file per serving rules above |
| `DELETE /api/v1/projects/[slug]/attachments/[id]` | write | Deletes row + file. Uploader, project OWNER/ADMIN, or org ADMIN only |

`serializeAttachment` (add to `src/lib/api.ts`): `{ id, filename, mimeType, sizeBytes, entityType, entityId, uploaderId, url: "/api/attachments/"+id, createdAt }`.

#### Server actions — new file `src/app/actions/attachments.ts`

`uploadAttachment(formData)` and `deleteAttachment(formData)` following §0.2. Audit actions:
`attachment.upload` (detail = filename), `attachment.delete`.

#### UI

- New component `src/components/AttachmentUploader.tsx` (`"use client"`):
  - Props: `{ entityType, entityId, projectId, attachments: SerializedAttachment[] }`.
  - Drag-and-drop zone + file picker button + **paste from clipboard** (`onPaste`, take
    `clipboardData.files`).
  - Grid of existing attachments: image thumbnails (`<img loading="lazy">`), non-images as a
    file-icon card with filename + size (`KB`/`MB` formatted); delete button (with `confirm()`).
  - Uploads via `fetch` to the v1 endpoint with progress state (disable while uploading).
- Mount it: case detail page (below steps), `RunExecutor.tsx` (inside the per-result comment
  area — attach evidence to a result while executing).

#### Cleanup

Extend the existing purge cron (`src/app/api/cron/purge` + `src/lib/cases-purge.ts`): when a
soft-deleted case is purged, delete its attachments' rows **and files**. Also add an orphan
sweep: attachments whose `entityId` no longer resolves → delete (log count to console).

#### Acceptance criteria

1. Given a MEMBER on a case page, when they drop a 2 MB PNG, then it appears as a thumbnail
   without page reload, and `GET /api/attachments/[id]` returns it inline.
2. Given an 11 MB file (default limit), upload is rejected with a visible error; nothing is stored.
3. Given a user who is not a member of the project, `GET /api/attachments/[id]` returns 404.
4. Given an uploaded `.svg`, downloading it sends `Content-Disposition: attachment`.
5. Given a VIEWER, the uploader UI is hidden and the POST endpoint returns 403.
6. Purging a deleted case removes its attachment files from disk.

#### Test plan

- e2e `e2e/attachments.spec.ts`: login → open seeded case → upload fixture PNG → assert thumbnail
  → download URL returns 200 → delete → assert gone.
- Unit-ish (can be an e2e API test): size limit 413; non-member 404; SVG disposition header.

---

### F-02 — Markdown rich text with inline images `[x]`

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

#### Dependencies (add to `package.json`)

`react-markdown`, `remark-gfm`, `rehype-sanitize`. **No raw HTML pass-through** — the default
sanitize schema, plus allow `img` with `src` restricted to `/api/attachments/` prefix or
`https:` URLs (implement via a custom `urlTransform` that returns `""` for anything else).

#### Implementation

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

#### Acceptance criteria

1. `**bold**`, tables, task lists, fenced code render correctly on the case detail page.
2. `<script>alert(1)</script>` in a description renders as inert text (sanitized), never executes.
3. Pasting a screenshot into the description editor uploads it and inserts a working image ref;
   the image renders on the case detail page.
4. Existing plain-text cases render unchanged (plain text is valid Markdown).
5. An image ref `![x](javascript:alert(1))` renders with empty/blocked src.

#### Test plan

e2e `e2e/markdown.spec.ts`: create case with GFM + XSS payload → assert rendered `<strong>`
exists and no dialog opened; screenshot-paste covered by a direct API insert + render assert.

---

### F-03 — Custom fields `[x]`

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

#### Data model

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

#### Validation — new file `src/lib/custom-fields.ts`

```ts
export function validateCustomValues(defs: CustomFieldDef[], input: Record<string, unknown>):
  { ok: true; json: string } | { ok: false; errors: { field: string; message: string }[] }
```
Rules: unknown keys rejected; required + active must be present and non-empty; type coercion
(`NUMBER` finite, `CHECKBOX` boolean, `DROPDOWN` value ∈ options, `MULTISELECT` ⊆ options,
`URL` must parse with http/https, `USER` must be a project member id). Inactive defs: values
preserved but not editable/required.

#### Wiring (each is a small, mechanical change)

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

#### Acceptance criteria

1. Admin creates required DROPDOWN "Component" [api, web, mobile]; creating a case without it
   fails with a field error; with `Component=web` succeeds and shows in table + CSV export as `cf_component`.
2. API `POST .../cases` with `custom: { component: "desktop" }` → 422 with
   `details: [{ field: "custom.component", ... }]`.
3. Disabling a def hides it from forms but old values still render on existing cases.
4. Defs are project-scoped: another project neither sees nor validates them.
5. VIEWER cannot open the Fields tab actions (server-side rejected too).

#### Test plan

e2e `e2e/custom-fields.spec.ts`: admin creates field → case form shows it → required validation
→ value visible in detail + table → CSV export contains header/value.

---

### F-04 — Shared steps `[x]`

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

#### Data model

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

#### Expansion helper — add to `src/lib/constants.ts` (or new `src/lib/steps.ts`)

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

#### Behavior rules

- Deleting a group that is referenced by ≥1 non-deleted case is **blocked** with a message
  listing up to 5 case display IDs (`caseDisplayId`) + count.
- Editing a group affects all referencing cases immediately (this is the point).
- Cloning a case keeps the reference (not a copy).
- Usage count = number of non-deleted cases whose `stepsJson` contains `"shared":"<id>"`
  (SQLite `LIKE '%"shared":"<id>"%'` is acceptable at this scale).

#### UI

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

#### Acceptance criteria

1. Create group "Login" with 3 steps; insert into 2 cases; run executor shows 3 expanded steps
   with badge in both.
2. Edit group → both cases show the new text without touching the cases.
3. Deleting the group is blocked with case IDs listed; after removing refs, delete succeeds.
4. CSV export of a case with a shared ref contains the expanded steps.
5. Old cases (inline-only) behave exactly as before.

#### Test plan

e2e `e2e/shared-steps.spec.ts` covering AC 1–3.

---

### F-05 — Test case history & versioning `[x]`

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

#### Data model

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

#### Write points (all in `src/app/actions/cases.ts` + API case create/update + CSV import)

Create a single helper `src/lib/case-revisions.ts`:

```ts
export async function recordRevision(caseId: string, authorId: string | null): Promise<void>
// loads current case, computes changed fields vs latest revision snapshot,
// skips write when nothing changed, else increments case.rev and inserts revision.
```

Call after **every** case create (rev 1, summary "created"), update, restore-from-trash,
bulk edit (one revision per affected case), CSV import update, API update. When a run is
created, copy each case's current `rev` into `TestRunResult.caseRev`.

#### UI

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

#### Acceptance criteria

1. Editing title then steps produces rev 2 ("title") and rev 3 ("steps"); History shows correct diffs.
2. No-op save (submit without changes) does not create a revision.
3. Restore rev 1 → case matches rev 1 fields, history now has rev 4 `restored from rev 1`.
4. A run created at rev 2 keeps `caseRev = 2`; after case edits, the run row shows the stale-rev chip.
5. Bulk-editing priority on 10 cases creates exactly 10 revisions.

#### Test plan

e2e `e2e/case-history.spec.ts` for AC 1–3.

---

### F-06 — Test plans & configurations `[x]`

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

#### Data model

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

#### Creation flow

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

#### Plan pages

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

#### Acceptance criteria

1. Plan with 2×2 config selection creates exactly 4 runs, each seeded with the selected cases,
   each named with its combo, plan page shows 4 rows + aggregate bar.
2. Executing results in child runs updates the plan aggregate live (on refresh).
3. Plan with no configs creates 1 run; standalone runs (no plan) work exactly as before.
4. 51+ combinations rejected with a clear form error.
5. Complete-plan completes all child runs and sets `completedAt`.

#### Test plan

e2e `e2e/plans.spec.ts` for AC 1, 3, 5.

---

### F-07 — Issue tracker integration: Jira, GitHub, GitLab `[x]`

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

#### Data model

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

#### Secret encryption — new file `src/lib/crypto.ts`

AES-256-GCM `encrypt(plaintext): string` / `decrypt(payload): string` using key derived
(scrypt) from `process.env.TF_SECRET` (already-existing app secret if present; otherwise add
`TF_SECRET` env with dev default and a startup console warning when defaulted). Output format
`v1:<iv b64>:<tag b64>:<cipher b64>`. **Never log decrypted tokens; never return `authEnc`
or decrypted values from any API/serializer.**

#### Provider clients — new file `src/lib/issue-providers.ts`

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

#### Flows

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

#### Acceptance criteria

1. Configured GitHub integration + failed result → Create issue → real issue exists with steps
   in body and backlink; result shows `#42` badge; `defectUrl` filled.
2. Wrong token → "Test connection" shows the provider's error; nothing saved as active.
3. Issue status changes upstream → after sync cron, badge updates.
4. `authEnc` never appears in any API response, page HTML, or audit detail (grep-level check).
5. Projects without integrations show the old plain-URL fields unchanged.

#### Test plan

Unit-style e2e against a mock: add a tiny mock provider route under `e2e/` fixtures (Playwright
`route()` interception of `api.github.com`) exercising flow 2 end-to-end. Encryption
round-trip test for `crypto.ts` (can be a Playwright API test hitting a debug-only action, or
a plain node script under `scripts/`).

---

### F-08 — Notifications: Slack, Discord, Teams, email `[x]`

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

#### Data model

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

#### Dispatcher — new file `src/lib/notifications.ts`

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

#### UI

Project settings → "Notifications" tab: `src/components/NotificationChannelsManager.tsx` —
list/create/edit/toggle channels, event checkboxes, "Send test message" button.
OWNER/ADMIN only. Audit: `notification.create|update|delete|test`.

#### Acceptance criteria

1. Slack channel subscribed to `run.completed` receives a formatted block message with a
   working link when a run completes; unsubscribed events send nothing.
2. 20 rapid failures in one run produce ≤ ~2 Slack messages (aggregation works).
3. "Send test message" delivers to the configured target and reports success/failure inline.
4. Email channel sends via existing mailer; malformed webhook URL fails channel save with a
   form error (must be https and host-matched per type: `hooks.slack.com`,
   `discord.com`/`discordapp.com`, `*.webhook.office.com`; document override env
   `TF_ALLOW_ANY_WEBHOOK_HOST=1` for self-hosters with proxies).
5. A dead webhook URL never delays or fails the originating user action.

#### Test plan

e2e with Playwright `route()` intercepting the Slack URL: create channel → complete run →
assert intercepted payload shape. Formatter unit checks via a script in `scripts/`.

---

### F-09 — Global search (⌘K command palette) `[x]`

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

#### Endpoint — `src/app/api/search/route.ts` (internal, session-only)

`GET /api/search?q=<term>&project=<slug optional>` →
```json
{ "cases": [{id, displayId, title, projectSlug}], "runs": [...], "suites": [...], "milestones": [...] }
```
Rules: min 2 chars (else empty result), max 10 per group, **scope = projects where the user is
a member** (single `WHERE project.members.some({userId})` on every query — this is the
security boundary, test it), SQLite `contains` (LIKE) on: case title/description + exact
`displayId` match (parse `TC-<slug>-<num>` → seq lookup), run name, suite name, milestone
name. Soft-deleted cases excluded. Order: displayId exact match first, then `updatedAt` desc.

#### UI — `src/components/CommandPalette.tsx` (`"use client"`, no new deps)

- Global keydown listener: `⌘K` / `Ctrl+K` opens; `Esc` closes; mounted once in the app layout
  `src/app/(app)/layout.tsx`.
- Modal: input (auto-focus, 200 ms debounce) → grouped results with icons; `↑/↓` +
  `Enter` navigation; result click → `router.push` to the entity page; footer hint row.
- Recent selections in `localStorage` (`tf_recent_search`, max 5) shown when input is empty.
- Also add a search button in the app header so the feature is discoverable without the shortcut.

#### Acceptance criteria

1. `⌘K` → typing a case title fragment shows the case within ~300 ms; Enter navigates to it.
2. Typing an exact display ID (`TC-WEB-001`) shows that case first.
3. A user who is not a member of project X never sees X's entities in results (verified by test).
4. 1-char input shows hint, no request fired.
5. Works from every app page (layout-mounted).

#### Test plan

e2e `e2e/search.spec.ts`: AC 1–3 (create second user for AC 3 via seed).

---

### F-10 — Saved filters / views `[x]`

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

#### Data model

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

#### Implementation

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

#### Acceptance criteria

1. Filter Priority=CRITICAL + tag=smoke → save as "Critical smoke" → reload → select view →
   same rows and URL params restored.
2. Default view auto-applies on first visit; "All cases" pseudo-view (always present, not in DB)
   clears it.
3. Shared view visible to another member; personal view is not.
4. Deleting a custom field referenced by a view doesn't break applying it.

#### Test plan

e2e `e2e/saved-views.spec.ts`: AC 1–2.

---

## 4. P2 features

Compact work orders — same conventions (§0, §1) apply. Each is still a single PR-sized unit
unless marked (large).

### F-11 — Additional automation result formats `[x]`

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

### F-12 — Official reporters + CLI (large) `[ ]`

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

### F-13 — Parameters / datasets `[x]`

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

### F-14 — Custom result statuses & custom roles `[x]`

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

### F-15 — Case review workflow `[x]`

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

### F-16 — Comments & @mentions `[x]`

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

### F-17 — Dashboards, run comparison, PDF & scheduled reports, public share links (large) `[x]`

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

### F-18 — Requirements & traceability matrix `[x]`

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

### F-19 — Environments `[x]`

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

### F-20 — SSO (OIDC first), 2FA, SCIM (large) `[ ]`

1. **OIDC**: generic provider via env (`TF_OIDC_ISSUER`, `TF_OIDC_CLIENT_ID`,
   `TF_OIDC_CLIENT_SECRET`) — discovery document, auth code + PKCE, `email` claim maps to the
   user (auto-provision org member when `TF_OIDC_AUTO_PROVISION=1`); reuse the existing OAuth
   callback structure in `src/app/api/auth/oauth/[provider]`. Admin can disable
   password login (`TF_DISABLE_PASSWORD_LOGIN=1`).
2. **2FA (TOTP)**: `User.totpSecretEnc`, `User.totpEnabledAt`, recovery codes (10, hashed like
   API keys, single-use). Settings → Account: QR enroll (otpauth URI; render QR client-side —
   dependency `qrcode` is acceptable), verify, disable (requires current code). Login flow gains
   a second step when enabled; lockout counts wrong TOTP attempts like wrong passwords.
3. **SAML/SCIM**: defer to a follow-up doc — out of scope here; note in README that OIDC covers
   Google Workspace/Azure AD/Okta/Keycloak.

### F-21 — Mute / quarantine flaky tests `[x]`

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

### F-22 — Importers: TestRail, Qase, TestLink `[x]`

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

### F-23 — Estimates & forecast `[x]`

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

### F-24 — Bulk move/copy & drag reorder `[x]`

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

## 5. P3 features

Scoped briefs — expand into full work orders when picked up.

### F-25 — Exploratory / session-based testing `[ ]`
`Session { projectId, charter, timeboxMinutes, status, startedAt, endedAt, testerId }` +
`SessionNote { sessionId, at, kind: NOTE|BUG|QUESTION|IDEA, bodyMd }`. Live session page with a
running timer, quick-add note hotkeys (N/B/Q/I), attachments per note (F-01), end-of-session
summary that can convert BUG notes → issues (F-07) and IDEA notes → draft cases. Lesson from
Test IO/Testmo; almost no OSS tool has this.

### F-26 — Built-in defects `[ ]`
`Defect { projectId, seq (DF-<SLUG>-<n>), title, severity, status: OPEN|CONFIRMED|FIXED|WONT_FIX|CLOSED, bodyMd, assigneeId }`,
linkable from results (complements, not replaces, F-07). Defects list + board (columns by
status). For teams without any external tracker (Qase parity).

### F-27 — BDD / Gherkin `[ ]`
Case template `GHERKIN`: raw feature text stored in `stepsJson` as `[{gherkin: "..."}]`, syntax
highlight, import/export `.feature` files (one scenario = one case, tags → tags), Cucumber JSON
results (F-11) match by scenario name.

### F-28 — Suite baselines `[ ]`
Snapshot an entire suite tree + case revisions (F-05) as a named baseline; runs can be created
"from baseline" pinning `caseRev`s; compare baseline vs current. TestRail Enterprise feature —
in OSS it's a headline.

### F-29 — AI assist (BYO key) `[ ]`
Settings → org: provider (Anthropic-compatible endpoint), model id, encrypted API key (F-07
crypto). Features: (1) generate draft cases from a pasted requirement/PRD text → preview list →
insert as DRAFT; (2) suggest missing edge-case steps for an open case; (3) near-duplicate case
detector (embeddings optional — v1 may use title trigram similarity locally, no key needed).
All AI actions are opt-in per click, never automatic; degrade cleanly when no key configured.
Default model when the org uses Anthropic: `claude-sonnet-5`.

### F-30 — XLSX & JSON export, saved import mappings `[ ]`
Export cases/runs as `.xlsx` (dependency `exceljs`) and `.json` (full fidelity incl. custom
fields, revisions optional flag); CSV import column-mapping step persists mapping per project.

### F-31 — "My work" page `[ ]`
`/my-work`: cross-project list of (a) results assigned to me in active runs, (b) cases assigned
to me, (c) reviews requested from me (F-15) — each with deep links and counts in the sidebar.

### F-32 — Case dependencies `[ ]`
`CaseDependency { caseId, dependsOnCaseId }` (no cycles — reject via DFS check). In a run,
when a prerequisite's result is FAILED/BLOCKED, dependents auto-suggest BLOCKED (one-click
accept, never silent).

### F-33 — API v2 `[ ]`
Full-coverage REST (`/api/v2`): milestones, members, webhooks, fields, attachments, plans,
environments; project-scoped tokens; per-key rate limits; typed OpenAPI with generated client
(`packages/api-client`). v1 stays frozen + supported.

### F-34 — LDAP / Active Directory `[ ]`
Self-hosted-only login backend via env (`TF_LDAP_URL`, bind DN, user filter); maps to org
members. Parity with TestLink/Kiwi for enterprises that lack OIDC.

### F-35 — Print & PDF-friendly case/run views `[ ]`
`@media print` stylesheets + "Print view" toggle rendering a clean document (cover block,
TOC, cases with expanded steps) — auditors love paper. PDF via browser print; no server-side
PDF dependency.

### F-36 — Mobile execution PWA `[ ]`
Manifest + service worker; the run executor gets a mobile layout (big status buttons, swipe
next/prev). Offline queue for result saves (retry on reconnect, last-write-wins with a visible
conflict toast). Kills the "walking around with a tablet in a lab" pain no competitor solves well.

### F-37 — In-app user docs / help center `[x]`

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

## 6. Leapfrog features

These make TestForge **better than** TestRail/Qase/TestLink — not just equal. All are small-to-medium and highly marketable.

### L-01 — Live quality badge (shields.io-style SVG) `[ ]`

**No competitor has this.** A public, cacheable SVG badge showing a project's latest pass rate —
embeddable in README/wiki like a CI badge.

- `BadgeToken { projectId, token, revokedAt? }` (opt-in per project, Settings → "Badge").
- `GET /badge/<token>.svg?metric=passrate|automation|cases&label=<text>` → self-generated SVG
  (two-cell shield: label + value; green ≥90, amber ≥70, red below; template literal, no deps),
  `Cache-Control: public, max-age=300`, no auth (token IS the auth; revocable), no project
  data beyond the number.
- Also `GET /badge/<token>.json` (shields.io `endpoint` schema) for custom styling.
- AC: badge renders in a GitHub README; revoking the token → 404; number matches the latest
  completed run's pass rate (muted tests excluded per F-21).

### L-02 — CI quality gates `[ ]`

**TestRail/Qase make you script this; TestForge makes it one call.**

- Project setting "Gate policy": `{ minPassRate: 95, maxNewFailures: 0, blockOnUntested: false, requiredTags: ["smoke"] }`.
- `GET /api/v1/projects/[slug]/gate?run=<id|latest>` → `200 { pass: true, checks: [...] }` or
  `200 { pass: false, checks: [{ name, expected, actual, pass }] }` (HTTP 200 both ways; the
  `pass` field decides).
- CLI (F-12): `testforge gate --project web --run latest --wait 600` → polls until the run
  completes or timeout, prints a check table, **exit code 0/1** → drops straight into any CI
  pipeline as a required step.
- `maxNewFailures` = failures on cases that PASSED in the previous completed run of the same
  source (regression detection, reuses F-17 comparison query).
- AC: a GitHub Actions example in the docs page runs green/red correctly against seeded data.

### L-03 — Test cases as code (GitOps sync) `[ ]`

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

### L-04 — Real-time collaborative run execution `[ ]`

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

### L-05 — One-file portable backup & restore `[ ]`

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

---

*End of document. When a feature ships: tick its checkbox here, flip the cell in
[FEATURE-COMPARISON.md](FEATURE-COMPARISON.md), and add the README line (§1 DoD).*
