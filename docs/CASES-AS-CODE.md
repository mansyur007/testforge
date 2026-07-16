# Test Cases as Code (L-03)

Two-way sync between a `tests/` folder of YAML files in your repo and
TestForge — cases get reviewed in pull requests like code. Complements
[SELF-HOSTED-MIGRATION.md](SELF-HOSTED-MIGRATION.md) for whole-instance moves;
this is for day-to-day authoring.

```bash
npx testforge-cli cases pull --project web            # server → tests/
# edit YAML, commit, review in a PR…
npx testforge-cli cases status --project web          # what changed where
npx testforge-cli cases push --project web            # files → server
```

Configuration: `TESTFORGE_URL` + `TESTFORGE_TOKEN` env vars (or `--url` /
`--token`); the token needs WRITE scope for `push`, READ is enough for `pull`
and `status`.

## Canonical YAML

One case per file. Path: `<dir>/<suite path, slugified>/<display id>.yaml`
(new cases: `<slug-of-title>.yaml` until the first push assigns an id, after
which the CLI renames the file).

```yaml
id: TC-WEB-001          # empty for new cases; assigned on first push
title: Login with valid credentials
suite: Auth/Login
priority: HIGH
type: FUNCTIONAL
tags: [smoke, auth]
preconditions: |
  User exists
steps:
  - action: Open /login
    expected: Form visible
  - action: Submit valid credentials
    expected: Redirected to dashboard
expected: |
  User lands on the dashboard
```

**Determinism is an acceptance criterion, not a nicety.** `pull` always emits:

- fields in this fixed order: `id, title, suite, priority, type, tags,
  preconditions, steps, expected` — keys with empty values are omitted
  (except `id`, `title`, `steps`);
- multiline strings as `|` block scalars, single-line strings plain
  (quoted only when YAML requires it);
- 2-space indent, no flow collections except `tags`.

Identical server state ⇒ byte-identical files ⇒ clean PR diffs.

### Out of scope in v1

- **Custom fields** and **datasets** are not synced — edit those in the UI.
- **Shared steps**: a case that references a shared-step group pulls with the
  steps **expanded** and a `# shared: <title>` comment. Pushing such a file
  back stores the steps inline and **breaks the shared-step link** — don't
  edit those files unless that's what you want.

## Sync state: `.testforge.lock`

Committed to your repo next to the case files. It is the **base** snapshot of
the last sync — what 3-way merging compares against:

```json
{ "project": "web", "url": "https://…", "pulledAt": "…",
  "cases": { "TC-WEB-001": { "hash": "<sha256 of canonical YAML>", "rev": 4 } } }
```

## Commands

| Command | Behavior |
|---|---|
| `cases pull` | Writes canonical files + rewrites the lock. Refuses to overwrite files with **local edits** (file hash ≠ lock hash) — lists them and exits 1; `--force-server` overwrites anyway. |
| `cases status` | Per case: `local` (file vs lock), `server` (server rev vs lock rev), verdict `clean / push / pull / CONFLICT / new-local / deleted-remote`. Always exits 0 (informational). |
| `cases push` | Classic 3-way per case: local-only change → pushed; server-only change → left alone (reported "will pull"); **both changed → conflict**, reported field-by-field (steps compared index-wise), exit 1. `--force-local` pushes anyway; `--force-server` re-pulls the conflicted files. New files always push; cases deleted on the server are reported, never auto-deleted locally. On success the lock is updated and assigned ids are written back into the YAML. |

The server enforces the same safety with optimistic concurrency: each update
carries the `baseRev` from the lock, and the server writes **only if** it still
matches the case's current rev — otherwise the item comes back
`status: "conflict"` untouched. A batch with one conflicting and four clean
items applies the four and reports the one (item-level atomicity — a red gate
in CI should point at the case, not abort the world). Pushing identical
content returns `status: "unchanged"` and records **no** new revision.

Every synced write goes through the same paths as a UI edit: F-05 revision
history, audit log (`case.sync`), and `case.created`/`case.updated` webhooks
all fire normally.

## Endpoint (for tooling authors)

`POST /api/v1/projects/{slug}/cases/sync` — Bearer WRITE key, max 500 items:

```json
{ "upserts": [
  { "displayId": "TC-WEB-001", "baseRev": 4,
    "fields": { "title": "…", "suite": "Auth/Login", "priority": "HIGH",
                "type": "FUNCTIONAL", "tags": ["smoke"],
                "preconditions": "…", "steps": [{"action": "…", "expected": "…"}],
                "expected": "…" } },
  { "fields": { "title": "Brand new case" } }
] }
```

Response items: `{ displayId, id, rev, status }` with
`status ∈ created | updated | conflict | unchanged | invalid`. Omitted
`fields` keys are left untouched on the server.

Full schema: `/docs/api` on your instance.
