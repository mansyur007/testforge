---
name: emha-deploy
description: Deployment and CI/CD workflow for the EMHA Universe apps (portal, tokopudidi, real-estate, postinia, testforge, code-server) running on the shared VPS behind the EMHA Universe Caddy (emha-caddy). Use when deploying, editing the Caddyfile, adding a subdomain, troubleshooting a down front-door, or wiring CI/CD for one of these repos.
---

# EMHA Universe — Deploy & CI/CD

Concrete deployment rules for the apps on VPS `103.169.207.239`. Adapted from the
generic ECC `deployment-patterns` skill, with this estate's real gotchas baked in.
General CI/CD strategy (rolling/blue-green/canary, health checks, prod-readiness
checklist) still applies — see the **Generic reference** section at the bottom — but
read the EMHA-specific rules first; they override the generic advice.

## The estate (single source of truth)

- One VPS, one domain: **`emha.space`** (sslip.io fully retired). SSH `root@103.169.207.239`,
  key `~/.ssh/development` (always pass `-i`).
- **EMHA Universe owns the shared Caddy** — container `emha-caddy` (binds ports 80/443)
  in the portal stack at `/opt/emhauniverse`. Every app joins the **external, standalone**
  docker network `emha_shared` (owned by no compose project; `docker network create emha_shared`)
  so Caddy can reverse-proxy it. *(Front door inverted 2026-07-03: was tokopudidi's caddy on
  `tokopudidi_default` — both now retired.)*
- Apps and their internal ports:
  | App | URL | VPS dir | container : port | CI key |
  |-----|-----|---------|------------------|--------|
  | Portal + **Caddy** | emha.space (apex) | /opt/emhauniverse | emha-portal:3100, **emha-caddy** | emhauniverse-ci |
  | Tokopudidi | toko.emha.space | /opt/tokopudidi | web/api (tokopudidi-web:3000/api:4000) | — |
  | Real Estate | real-estate.emha.space | /opt/real-estate | real-estate:3000 | real-estate-ci |
  | Postinia POS | postinia.emha.space | /opt/postinia | postinia:8080 | postinia-ci |
  | TestForge | testforge.emha.space | /opt/testforge | testforge:3000 | — |
  | code-server | code.emha.space | /opt/code-server | code-server:8080 | — (VPS-only, `docker-compose.yml`, no repo/CI) |

## CRITICAL gotchas (these have bitten us — do not skip)

1. **Tokopudidi compose MUST pass `--env-file .env.production`.**
   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d <svc>
   ```
   Without it `${POSTGRES_USER}` / `${DATABASE_URL}` resolve empty → postgres comes up
   "unhealthy" → compose gates web/api → **toko.emha.space goes down** (500s / no upstream),
   and api gets an empty `DATABASE_URL` (Prisma 500s). Since the front door (emha-caddy) now
   lives in the emhauniverse stack, this no longer takes down the *whole* estate — just toko —
   but it's still a real outage. The healthcheck has a runtime fallback
   (`pg_isready -U $${POSTGRES_USER:-postgres}`) so a forgotten env-file won't tear the
   stack down, but api/web still need the env-file to actually work. **Postinia and the
   portal auto-load `.env` (default name) — they do NOT need `--env-file`.** Only tokopudidi does.

2. **Caddyfile is bind-mounted as a single file.** An rsync/`git reset --hard` (which the
   emhauniverse deploy runs) replaces the inode, so `caddy reload` reads STALE content.
   Always recreate the container instead — from the **emhauniverse** stack (no `--env-file`
   needed there; the portal/caddy stack auto-loads no secrets):
   ```bash
   cd /opt/emhauniverse && docker compose -f docker-compose.prod.yml up -d --force-recreate caddy
   ```
   The emhauniverse `deploy.yml` already does this on every deploy. If hand-editing on the
   VPS, use `cat >` (in-place, preserves inode) — never an editor that swaps the inode.

3. **Routing lives in the emhauniverse repo's `Caddyfile`, commit it there.** Editing only on
   the VPS is unsafe — the emhauniverse deploy rsyncs `--delete` and overwrites it. (The old
   tokopudidi `Caddyfile` was deleted; do not resurrect routing there.)

4. **`NEXT_PUBLIC_*` is baked at build time** (tokopudidi web, portal). Changing a public URL
   means rebuilding the image, not just restarting.

5. **No wildcard DNS.** Each new subdomain needs its own `A` record → `103.169.207.239`
   **before** Caddy can issue a cert. Add the A record first, then the Caddy block, then deploy.

6. **The VPS has no GitHub creds.** CI/CD pushes code IN (rsync over SSH), it never pulls.
   Each repo has its own dedicated ed25519 deploy key (see table) whose public half is in the
   VPS `~/.ssh/authorized_keys`.

## Adding a new app to the estate

1. `A` record `newapp.emha.space` → `103.169.207.239`.
2. App `docker-compose.prod.yml`: join `emha_shared` as **external**, expose port
   internal-only (no host port mapping needed — Caddy reaches it over the network).
3. Add a route block in the **emhauniverse repo** `Caddyfile`: `newapp.emha.space { reverse_proxy newapp:PORT }`. Commit it.
4. Push emhauniverse (or manually `cd /opt/emhauniverse && docker compose -f docker-compose.prod.yml up -d --force-recreate caddy`, gotcha #2).
5. Smoke-test `https://newapp.emha.space`.

## CI/CD shape (per repo, GitHub Actions)

- `ci.yml`: build / type-check gate on PR + push to main.
- `deploy.yml`: on push to main, runner rsyncs source to the VPS dir, then
  `docker compose -f docker-compose.prod.yml up -d --build`, then smoke-tests the host.
- Secrets: `VPS_HOST` / `VPS_USER` / `VPS_SSH_KEY` (the repo's dedicated deploy key).
- **Manual fallback** (no Action): rsync source from a dev machine that has it, then the same
  compose-up on the box.

## Stateful apps — protect the data

- Postinia: named volume `postinia_data` → `/app/data` (`shared.json`), seeded on first run.
- Real Estate: `real-estate_data` → `/app/data` (content.json) + `real-estate_uploads` →
  `/app/public/uploads`, pinned via `name:` in compose. Old `bsb-village_*` volumes kept as backup.
- **Never** `docker compose down -v` on these — `-v` destroys the named volumes.

---

## Generic reference (from ECC deployment-patterns)

For non-EMHA context — strategies, health checks, prod-readiness checklist:

- **Rolling** (default, zero-downtime, needs backward-compatible changes); **Blue-green**
  (instant rollback, 2x infra); **Canary** (route a small % first, needs traffic splitting).
- **Health endpoint**: `/health` → 200 `{status:"ok"}`; a detailed variant can check
  db/redis/external and return 503 when degraded.
- **Twelve-factor config**: all config via env vars, validate at startup and fail fast.
- **Production-readiness checklist** before any prod deploy: tests pass, no hardcoded secrets,
  structured logs without PII, pinned image versions, env vars documented + validated, resource
  limits set, TLS on all endpoints, CVE scan, CORS locked to allowed origins, rate limiting,
  security headers (CSP/HSTS/X-Frame-Options), rollback plan tested, migrations tested on
  prod-sized data, runbook for common failures.
- **Rollback**: keep the previous image tagged; ensure migrations are backward-compatible;
  prefer feature flags so new features can be disabled without a deploy.
