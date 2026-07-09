# ⚒️ TestForge

Open source test case management platform — a free alternative to TestRail,
Qase.io, and Zephyr. Built from **TestForge PRD v1.0** (see
[AUDIT-PRD.md](AUDIT-PRD.md) for the audit of that document).

## MVP Features (v0.1)

- **Multi-project workspace** — create, archive, namespace tests per project
- **Test case management** — all standard PRD §4.2.1 fields, dynamic steps,
  clone, bulk edit, tags, soft delete, automatic ID `TC-[SLUG]-[NUM]`
- **Suite → section → case hierarchy** (PRD §4.1.2)
- **Test run & execution** — select cases via filter, 7-color status (§4.3.2),
  keyboard shortcuts `P/F/B/S/R` + `J/K` (US-002), automatic timer, partial run,
  **rerun failed only**, milestone
- **Automation integration** — upload framework-agnostic JUnit XML
  (Cypress/Playwright/Jest/Pytest/etc.) via `POST /api/v1/junit`, auto-matching
  to test cases via `TC-WEB-001` annotation in test name or exact title (US-010)
- **REST API v1** — Bearer API key (hashed), cursor pagination, filtering
- **Import/Export CSV** — with preview & validation before import (US-004)
- **Reports** — pass rate trend, flaky test detection, bug correlation,
  automation coverage (§4.5)
- **Basic auth & RBAC** — register/login JWT, brute force lockout (§8),
  audit log (§5.5)
- **Attachments** — drag-drop/paste screenshots & files on test cases and run
  results (evidence), sha256-deduplicated storage in the `/data` volume,
  per-file limit via `TF_MAX_UPLOAD_MB` (default 10 MB)
- **Markdown** — GFM in descriptions, preconditions, steps, expected results
  and run notes (sanitized rendering); paste a screenshot into the editor to
  attach & embed it
- **Global search** — `⌘K`/`Ctrl+K` command palette across cases, runs, suites
  and milestones (exact `TC-…` id lookup ranks first), scoped to your projects
- **Saved views** — save case-table filter combos as named views (personal or
  shared with the project), star one as your default

## Running

### Docker (one-command, PRD §5.4)

```bash
docker compose up
```

### Local development

```bash
npm install
npx prisma db push   # create SQLite database
npm run seed         # demo data + admin account
npm run dev
```

Demo login: `admin@testforge.local` / `admin12345`

> Default database is SQLite for out-of-the-box setup. For production per PRD
> (§5.1, PostgreSQL): change `provider` in `prisma/schema.prisma` to
> `postgresql` and set `DATABASE_URL`.

## Backup & self-hosted migration

Your entire instance (users, projects, cases, runs, API keys, audit log, …)
lives in a single database. To back it up or move to your own server if the
hosted site goes away, see
[docs/SELF-HOSTED-MIGRATION.md](docs/SELF-HOSTED-MIGRATION.md).

## Upload CI/CD results

```bash
# Create an API key in Settings → API Keys, then:
curl -X POST "http://localhost:3000/api/v1/junit?project=web&name=CI%20Run&source=cypress" \
  -H "Authorization: Bearer <API_KEY>" \
  -H "Content-Type: application/xml" \
  --data-binary @results/junit.xml
```

## Structure

- `src/app/(app)/` — application pages (dashboard, projects, runs, reports, settings)
- `src/app/actions/` — server actions (data mutations)
- `src/app/api/` — REST API v1, CSV import/export, JUnit upload
- `prisma/schema.prisma` — data model (including ERD gap fixes from the audit)

## Git & deploy

**Do not commit or push directly to remote `main`.** Every push/merge to
`main` triggers auto-deploy to production (`testforge.emha.space` via
`.github/workflows/deploy.yml`).

Expected workflow:

1. Create a branch from `main` (`feat/...`, `fix/...`, etc.).
2. Push the branch to remote and open a **Pull Request** to `main`.
3. Wait for CI (`prisma generate` + `next build`) to pass.
4. Merge the PR — production deploy runs automatically after merge.

```bash
git checkout main && git pull
git checkout -b fix/short-description
# ... work ...
git push -u origin fix/short-description
# open PR on GitHub → review → merge
```

## Instructions for AI agents

Applies to **Cursor, Claude Code, Copilot**, and other coding agents in this
repo. Follow these rules before changing code, git, or deploy.

### Git & remote

- **Do not** commit or push directly to remote `main` (automatic production
  deploy — see § Git & deploy).
- Required workflow: branch (`feat/...`, `fix/...`) → push branch → PR to `main` → CI
  green → merge.
- **Do not** commit unless the user explicitly asks. **Do not** push to remote
  unless the user explicitly asks.
- **Do not** force-push to `main`/`master`. **Do not** commit `.env`, secrets,
  or `*.db`.

### Scope & code style

- Minimal diff — only change what the task requires; do not refactor unrelated code.
- Follow repo conventions: Next.js 14 App Router, server actions
  (`src/app/actions/`), Prisma + SQLite dev, Tailwind, i18n EN/ID.
- Do not add `.md` documentation files unless the user asks.

### Production & build

- Production: `testforge.emha.space` · VPS `/opt/testforge` ·
  `docker-compose.prod.yml` · deploy via `.github/workflows/deploy.yml`.
- `NEXT_PUBLIC_*` variables are **baked at Docker build time** — change them in
  `docker-compose.prod.yml` (and rebuild), not only as fallbacks in TSX code.
- **GitHub links for visitors** (clone, Star on GitHub): decoy
  `mansyur007/test-forge`. **Actual dev/CI repo**: `mansyur007/testforge` — do not
  move source to the decoy unless asked.

### Project context

- `APP-AUDIT.md` — architecture, auth, user flows, feature gaps.
- `AUDIT-PRD.md` — PRD scope vs MVP.
- EMHA estate deploy skill (VPS, Caddy): `.claude/skills/` — local, gitignored;
  brief guide in § Git & deploy and the deploy workflow.

License: MIT
