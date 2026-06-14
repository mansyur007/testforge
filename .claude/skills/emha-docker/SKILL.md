---
name: emha-docker
description: Docker and Docker Compose conventions for the EMHA Universe Node.js apps (portal, real-estate, postinia, testforge) sharing one VPS and Tokopudidi's Caddy network. Use when writing or reviewing a Dockerfile / compose file, debugging container networking or volumes, or hardening a container in this estate.
---

# EMHA Universe — Docker & Compose

Docker conventions for this estate's apps. Adapted from the generic ECC `docker-patterns`
skill, with the estate's networking/volume/Caddy reality baked in. Generic Compose, security,
and debugging guidance is in the **Generic reference** at the bottom — but the EMHA rules first.

## Estate conventions (apply to every app here)

1. **Join Tokopudidi's network as external — don't publish host ports.** Caddy reverse-proxies
   over the docker network, so apps expose ports *internal only*. A host port mapping is
   usually unnecessary (and undesirable — it bypasses Caddy/TLS).
   ```yaml
   services:
     myapp:
       # no "ports:" needed — Caddy reaches myapp:PORT over the shared network
       networks:
         - tokopudidi_default
   networks:
     tokopudidi_default:
       external: true
   ```
   Caddy's route (in the **tokopudidi repo** Caddyfile) is `myapp.emha.space { reverse_proxy myapp:PORT }`.

2. **Internal ports are fixed per app** (Caddy routes to these names:ports):
   portal `emha-portal:3100`, real-estate `real-estate:3000`, postinia `postinia:8080`,
   testforge `testforge:3000`. Keep them stable — changing one means editing the Caddyfile too.

3. **`.env` auto-load vs `--env-file`.** Postinia and the portal use a default-named `.env`
   that compose auto-loads, so their deploy is a plain `up -d`. **Tokopudidi is the exception**:
   its compose needs `--env-file .env.production` or postgres comes up unhealthy and the shared
   Caddy (front door for everyone) goes down. See the `emha-deploy` skill, gotcha #1.

4. **Named volumes are pinned and sacred.** Stateful apps pin volume names via `name:` so they
   survive a rename/redeploy:
   - postinia: `postinia_data` → `/app/data` (`shared.json`)
   - real-estate: `real-estate_data` → `/app/data` (content.json), `real-estate_uploads` → `/app/public/uploads`
   **Never run `docker compose down -v`** against these — `-v` deletes the named volumes and the
   live data with them. Old `bsb-village_*` volumes are kept as backup; don't reuse those names.

5. **Caddyfile is bind-mounted as a single file** → editing it needs a container recreate, not a
   reload (inode swap). This is a deploy concern; see `emha-deploy` gotcha #2.

## Reviewing a Dockerfile in this estate

- Multi-stage, `node:22-alpine` pinned (never `:latest`), non-root user, deps copied before
  source for layer caching, `.dockerignore` excludes `node_modules/.git/.env*`.
- Add a `HEALTHCHECK` hitting the app's `/health` (or `/` if no health route) — Caddy and
  compose gating behave better with one. Postinia is dependency-free Node; keep its image lean.

## Debugging containers on the VPS

```bash
ssh -i ~/.ssh/development root@103.169.207.239
docker compose -f /opt/<app>/docker-compose.prod.yml logs -f --tail=50 <svc>
docker compose exec <svc> sh
docker network inspect tokopudidi_default      # confirm app is attached + see its name
docker compose exec <app> wget -qO- http://<other>:PORT/health   # test in-network reachability
```

---

## Generic reference (from ECC docker-patterns)

- **Multi-stage Dockerfile**: deps → build → minimal production stage; run as non-root
  (`adduser -S appuser -u 1001`); `ENV NODE_ENV=production`; `HEALTHCHECK`.
- **Local dev compose**: bind-mount source `.:/app` + anonymous `/app/node_modules` for hot
  reload; postgres with `pg_isready` healthcheck + `depends_on: condition: service_healthy`.
- **Networking**: services resolve each other by service name; split frontend/backend networks
  so the db is only reachable from the api; bind dev ports to `127.0.0.1` only.
- **Security**: pin tags, non-root, `security_opt: [no-new-privileges:true]`, `cap_drop: [ALL]`
  (add back only `NET_BIND_SERVICE` if binding <1024), `read_only: true` + `tmpfs` where possible.
- **Secrets**: `.env` (gitignored) or Docker secrets — never hardcode in the image or commit `.env`.
- **Anti-patterns**: data in containers without volumes, running as root, `:latest`, one giant
  multi-service container, secrets in `docker-compose.yml`.
