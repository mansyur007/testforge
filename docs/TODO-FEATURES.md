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
| — | L-01…L-05 leapfrog, interleaved | see each | Designed to beat competitors, not match them | ~~Fable 5~~ → **Opus 4.8**: net-new design, but Fable wrote full work orders inline (2026-07-13, §7.5) — build from those |

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

### F-12 — Official reporters + CLI (large) `[x]`

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

### F-20 — SSO (OIDC first), 2FA, SCIM (large) `[x]`

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

#### 1. Threat model (what this feature must survive)

| Threat | Countermeasure (built below) |
|---|---|
| Authorization-code interception / replay | PKCE S256 + single-use `state` + `nonce` claim check |
| IdP response forgery | ID-token signature verified against the issuer's JWKS (`jose` `createRemoteJWKSet` — already a dependency, **no new auth libs**) |
| Account takeover via unverified IdP email | require `email_verified === true` claim unless `TF_OIDC_ALLOW_UNVERIFIED_EMAIL=1` |
| Session fixation across the 2FA step | password success does NOT create a session — a separate short-lived pending token does (§4) |
| TOTP brute force | wrong codes feed the same in-memory lockout as wrong passwords (`recordFailure(email)` in `src/app/actions/auth.ts`) |
| Recovery-code reuse | single-use rows, sha256-hashed like `ApiKey.keyHash` (`src/lib/auth.ts:verifyApiKey` pattern) |
| Secret leakage | `totpSecretEnc` encrypted with `src/lib/crypto.ts` (F-07 AES-256-GCM); never serialized, never logged, never in audit detail |

#### 2. Data model (add to `prisma/schema.prisma`)

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

#### 3. OIDC (generic provider, env-configured)

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

#### 4. 2FA (TOTP, RFC 6238 — no new crypto deps)

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

#### 5. `TF_DISABLE_PASSWORD_LOGIN=1` (MUSTs)

Server-side rejects (not just hidden UI) in: `login`, `register`, `forgotPassword`,
`resetPassword` — each returns `{ error: "Password login is disabled on this instance." }`.
`/login` hides the password form and shows only SSO/social buttons. Boot-time console warning
if set while `TF_OIDC_ISSUER` is missing (would lock everyone out — warn, don't crash;
social OAuth may still be configured).

#### 6. Serializer & API guarantees

`totpSecretEnc`, recovery hashes, and the `tf_2fa` token never appear in any serializer, API
response, page prop, or audit `detail` (grep-level check, same bar as F-07 AC 4). No API-v1
surface is added — 2FA/SSO are session concerns; API keys are unaffected.

#### 7. Acceptance criteria

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

#### 8. Test plan

e2e `e2e/two-factor.spec.ts`: enroll (read the base32 from the UI, compute codes in-test with
a tiny TOTP helper duplicated in the spec), verify login second step, recovery-code path,
disable. OIDC is covered by a **local mock IdP** spun up inside the spec (same technique as
`e2e/integrations.spec.ts`'s GitHub mock): a node HTTP server serving discovery, JWKS (key
generated with `jose.generateKeyPair`), `authorization_endpoint` that immediately redirects
back with a code, and a `token_endpoint` returning a signed id_token — asserts the happy path
and the bad-nonce rejection. Reuses `TF_ALLOW_INSECURE_INTEGRATION_URL`-style env:
`TF_OIDC_ISSUER=http://127.0.0.1:<port>` must be allowed when `NODE_ENV !== "production"`.

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

Scoped briefs — expand into full work orders when picked up. **Exception:** F-35 and F-36
are already full work orders (Fable 5 design handoff, 2026-07-13 — see also appendix §7).

### F-25 — Exploratory / session-based testing `[x]`

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

### F-26 — Built-in defects `[x]`

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

### F-27 — BDD / Gherkin `[x]`

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

### F-28 — Suite baselines `[x]`

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

### F-29 — AI assist (BYO key) `[x]`

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

### F-30 — XLSX & JSON export, saved import mappings `[x]`

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

### F-31 — "My work" page `[x]`

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

### F-32 — Case dependencies `[x]`

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

### F-33 — API v2 `[x]`
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

### F-34 — LDAP / Active Directory `[x]`
Self-hosted-only login backend via env (`TF_LDAP_URL`, bind DN, user filter); maps to org
members. Parity with TestLink/Kiwi for enterprises that lack OIDC.

### F-35 — Print & PDF-friendly case/run views `[x]`

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

#### 1. Routes & files

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

#### 2. Document anatomy (cases catalog)

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

#### 3. Document anatomy (run report)

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

#### 4. Print CSS — exact rules (`src/app/print/print.css`)

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

#### 5. Implementation order & AC

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

### F-36 — Mobile execution PWA `[x]`

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

#### Part A — Installability (manifest + icons + viewport)

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

#### Part B — Service worker (hand-rolled, ~80 lines, no workbox/next-pwa dependency)

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

#### Part C — Offline result queue

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

#### Part D — Mobile executor layout (`RunExecutor.tsx`, breakpoint `md` = 768px)

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

### L-01 — Live quality badge (shields.io-style SVG) `[x]`

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

### L-02 — CI quality gates `[x]`

**TestRail/Qase make you script this; TestForge makes it one call.**

> **Full work order — written 2026-07-13 by Fable 5.** Semantics below are final; the tricky
> part of this feature is not code volume but *definition precision* — every check is pinned
> down here so CI verdicts are deterministic and disputes point at the doc, not the code.

#### 1. Policy storage & UI

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

#### 2. Semantics (`src/lib/gate.ts:evaluateGate(projectId, runId)` — single source of truth)

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

#### 3. Endpoint

`GET /api/v1/projects/[slug]/gate?run=<id|latest>` — §0.3 pattern, `guard(req)` (read scope;
gates are consumed by CI which should hold read keys). `run=latest` (default) = newest run of
the project by `createdAt` **regardless of status** — the CLI's `--wait` handles incompleteness;
an ACTIVE run evaluates against current results and the response's `run.status` says so.
HTTP 200 whether passing or failing (the `pass` field decides; non-200 is reserved for real
errors). Add to `src/lib/openapi.ts` + docs page. No webhook (CI polls; nothing mutates).

#### 4. CLI (`packages/cli/bin/testforge.js` — extend, same zero-dep style)

`testforge gate --project <slug> [--run <id|latest>] [--wait <seconds>] [--url] [--token]`
1. `--wait N` (default 0): poll every 5 s until `run.status === "COMPLETED"` or N seconds
   elapse; timeout → print `gate: timed out after Ns waiting for run to complete` → **exit 1**.
2. Print an aligned table: `CHECK | EXPECTED | ACTUAL | RESULT` (`pass` → `OK`, else `FAIL`)
   plus a final line `gate: PASS` / `gate: FAIL`. No color codes (CI logs).
3. Exit 0 iff `pass === true`. Any HTTP/parse error → stderr + exit 1 (a broken gate must
   block, not wave through).

#### 5. Docs & example

Help center (`src/content/help/`): extend the automation topic with a "CI quality gates"
section containing this exact GitHub Actions step (verified against seed data in the e2e):

```yaml
- name: TestForge quality gate
  run: npx testforge-cli gate --project web --run latest --wait 600
  env:
    TESTFORGE_URL: ${{ vars.TESTFORGE_URL }}
    TESTFORGE_TOKEN: ${{ secrets.TESTFORGE_TOKEN }}
```

#### 6. Acceptance criteria

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

#### 7. Test plan

e2e `e2e/gate.spec.ts`: seeds two runs via the results API (baseline + regressed), saves a
policy as admin through the UI, asserts endpoint JSON for AC 1–3, then spawns the CLI for
AC 4. `scripts/`-level unit coverage is unnecessary — `evaluateGate` is exercised through the
endpoint.

### L-03 — Test cases as code (GitOps sync) `[x]`

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

#### 1. Canonical YAML (documented in `docs/CASES-AS-CODE.md`, written as part of this feature)

One case per file, path = `<dir>/<suite path slugified>/<display id>.yaml` (new cases:
`<slug of title>.yaml` until the first push assigns an id, after which the CLI renames the
file). Field order is FIXED (id, title, suite, priority, type, tags, preconditions, steps,
expected) — pull always emits this order, multiline strings always as `|` block scalars,
2-space indent, no flow collections except `tags`. Determinism is what makes PR diffs
reviewable; it is an AC, not a nicety. Out of scope in v1 (documented): custom fields,
datasets, shared-step references (a case using shared steps pulls **expanded** with a
`# shared: <title>` comment and pushes back as inline — the doc warns editing those files
breaks the link).

#### 2. CLI commands (`packages/cli` — new dependency `yaml`, the only one; keep node ≥18)

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

#### 3. Server endpoint (the only new server surface)

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

#### 4. Acceptance criteria (expands the brief's three)

1. pull → push with no edits → server records **zero** new revisions ("unchanged" path).
2. pull → edit title locally → push → pull is idempotent (second pull rewrites nothing).
3. Title edited both locally and on the server → push exits 1 naming the case + field; then
   `--force-local` wins, or `--force-server` restores; lock is consistent after either.
4. New YAML case → push assigns `TC-<SLUG>-<n>`, file renamed, id written into the file.
5. A batch with 1 conflicting + 4 clean items applies the 4 and reports the 1 (item-level
   atomicity, not all-or-nothing — CI-friendly).

#### 5. Test plan

e2e `e2e/cases-as-code.spec.ts` drives the CLI as a subprocess (F-12 e2e technique) in a temp
dir against the seeded project: pull → assert deterministic bytes (pull twice, diff empty) →
AC 2, 3, 4 flows via API-injected server edits.

### L-04 — Real-time collaborative run execution `[x]`

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

#### 1. Event bus — `src/lib/run-events.ts`

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

#### 2. HTTP surface (internal, not API-v1 — session auth only, like `/api/attachments`)

| Route | Behavior |
|---|---|
| `GET /api/runs/[runId]/events` | SSE stream. `requireSession`-equivalent via `getSession()` (401 JSON if none) + project-membership check (404 for non-members, F-01 rule). `ReadableStream`, headers `text/event-stream`, `Cache-Control: no-store`, `X-Accel-Buffering: no`. On connect: send current presence snapshot. Every 20 s send a `: ping` comment (keeps proxies from idling out). `export const dynamic = "force-dynamic"`, node runtime. Unsubscribe + clear interval on `req.signal` abort |
| `POST /api/runs/[runId]/presence` | Body `{ caseId: string \| null }`. Same auth. Upserts `{lastSeen: now}` and publishes a presence snapshot. Client heartbeats every 20 s + on case navigation; `navigator.sendBeacon` with `{ leave: true }` on `pagehide` deletes the entry immediately |

**Publish point**: at the end of `submitResult` (`src/app/actions/runs.ts:97`) after the DB
write + audit, `publishRunEvent(...)` with the writer's session identity. Fire-and-forget,
same discipline as `dispatchWebhook` (§0.4). Also publish from the API results-upsert route
and JUnit ingest (`by` = the API key's user) so automation uploads appear live too.

#### 3. `RunExecutor.tsx` client behavior

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

#### 4. Non-goals (pinned so nobody builds them)

No hard locks, no operational-transform/CRDT, no offline queue (that's F-36 D), no
cross-run global presence, no persistence of presence (restart = empty map, clients
repopulate on next heartbeat).

#### 5. Acceptance criteria (expands the brief's)

1. Two sessions, one run: A submits PASS → B's row updates + flashes within 2 s without
   refresh; B's presence avatar shows in A within 20 s of B opening the run.
2. Kill B's tab → B's avatar gone from A within 60 s (sweep) or instantly via beacon.
3. `EventSource` blocked (e2e: route-abort the events URL) → executor submits/navigates
   exactly as today; no console error spam (≤1 warn per retry, then silence after giving up).
4. A and B open the same case; A submits FAIL while B's form is dirty → B sees the
   overwrite toast; B's Undo restores B's status and A gets the mirror toast.
5. Non-member GET of the events URL → 404. Automation upload to the run appears live (AC 1
   path with the API as the writer).

#### 6. Test plan

e2e `e2e/realtime-run.spec.ts` with **two Playwright contexts** (two logged-in users, same
run) covering AC 1–4; AC 5 via a raw `request` call. SSE in Playwright needs no special
handling (it's just fetch); assert on DOM effects, not the wire format.

### L-05 — One-file portable backup & restore `[x]`

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

#### 1. Archive format (`.tfbackup` = zip)

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

#### 2. Export — `src/lib/backup.ts` + `GET /api/admin/backup`

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

#### 3. Restore — `scripts/restore.mjs <file> [--yes]` + first-run UI path

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

#### 4. Acceptance criteria (expands the brief's)

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

#### 5. Test plan

e2e `e2e/backup-restore.spec.ts`: seed → download backup via authed request → reset DB
(existing force-reset consent env) → restore via `scripts/restore.mjs --yes` subprocess →
assert AC 1 spot checks. AC 4 with a deliberately truncated copy of the same archive.

---

## 7. Appendix — Fable design handoff (written 2026-07-13)

Fable 5 was the assigned model for the presentation-heavy work (F-35, F-36, L-01 visuals,
and Leapfrog polish). This appendix freezes the design system's *working vocabulary* so any
model can produce UI that is indistinguishable from the existing app. It documents what the
code already does — when in doubt, grep for the pattern and copy it.

### 7.1 Tokens (source of truth: `tailwind.config.ts` + `src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `ink` | `#1b1a22` | Print body text, high-contrast text on light |
| `accent` | `#4f46e5` (indigo-600-ish) | THE brand color: primary buttons, links, icon strokes |
| `accent.tint` | `#f3f2fd` | Accent-washed backgrounds |
| accent-soft | `rgba(79,70,229,.14)` | Icon fills (`.tf-acf`), mention chips |
| App background | `slate-50` | `<body>` |
| Card | `bg-white rounded-xl border border-slate-200 p-6` | Every content card, verbatim |
| Shell | `bg-slate-900 text-slate-300`, `w-60` fixed sidebar | Also PWA `theme_color` |
| Warning recipe | `bg-amber-50/-100` + `text-amber-800/900` | Preconditions box, stale-rev + queued chips |

### 7.2 Typography (loaded in `src/app/layout.tsx` via next/font CSS variables)

- **Space Grotesk** = `--font-display` / `font-display`: h1–h3 only (globals.css applies it
  globally to headings with `letter-spacing: -0.01em`). Never for body.
- **IBM Plex Sans** = `--font-sans`: everything else. The app's default density is
  **`text-sm` (14px) slate** — body copy, tables, forms. `text-base` is the exception
  (mobile executor steps, marketing).
- **IBM Plex Mono** = `--font-mono`: display IDs (`TC-WEB-001`), counters (`12 / 40`),
  code, tiny uppercase meta labels.
- Print scale is its own thing — see F-35 §4 (10.5pt body, nothing lighter than slate-600).

### 7.3 Component idioms (grep-and-copy patterns)

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

### 7.4 Design judgment rules (the taste, encoded)

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

### 7.5 Handoff status

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

*End of document. When a feature ships: tick its checkbox here, flip the cell in
[FEATURE-COMPARISON.md](FEATURE-COMPARISON.md), and add the README line (§1 DoD).*
