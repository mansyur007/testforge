# Self-Hosted Migration & Full Backup

This guide explains how to take a **complete copy of a TestForge instance** and
restore it on your own server — so if the hosted site (e.g.
`testforge.emha.space`) ever goes away, you can keep all of your data on
infrastructure you control.

> **Scope:** whole-instance. One backup contains **everything** — all
> organizations, users, projects, suites, cases, runs & results, milestones,
> API keys, webhooks, and the audit log. There is no data left behind.

---

## Why a database copy is a complete export

TestForge stores **all** of its state in a single SQLite database file:
`/data/testforge.db` (see `docker-compose.yml` / `docker-compose.prod.yml`).
Copying that one file copies the entire instance, including things a CSV export
can never carry:

| Data | In the DB backup? | Notes |
| --- | --- | --- |
| Users & passwords | ✅ | Stored as `passwordHash` — **users keep their existing passwords** after migration. |
| API keys | ✅ | Stored as `keyHash` — **existing keys keep working**, no need to regenerate CI tokens. |
| Projects, suites, cases | ✅ | Including soft-deleted (recycle-bin) cases. |
| Test runs & results | ✅ | Full execution history, comments, timings. |
| Members & roles | ✅ | Organization + per-project membership. |
| Milestones, webhooks | ✅ | Webhook signing secrets included. |
| Audit log | ✅ | Complete `AuditLog` history. |

Because the copy is byte-for-byte, referential integrity (all the `cuid` IDs
and relations) is preserved automatically — there is nothing to re-link.

> ⚠️ **A backup file is highly sensitive.** It contains password hashes, API
> key hashes, and webhook secrets. Store and transfer it like a secret
> (encrypted at rest, never in a public bucket or repo).

---

## What you need on the new server

- Docker + Docker Compose.
- A clone of this repository (for `Dockerfile` + compose files), **or** just the
  published image.
- The backup archive produced below.
- Your `AUTH_SECRET` (see the note on sessions [below](#a-note-on-auth_secret-and-sessions)).

---

## 1. Back up the source instance

The most robust method archives the **entire data volume**, which captures the
database plus any SQLite side-files (`-wal` / `-shm`) in a consistent state.

For a guaranteed-consistent snapshot, stop the app first (a few seconds of
downtime). If you cannot stop it, skip the `stop`/`start` — the archive is still
usually fine, but stopping removes any risk of a mid-write copy.

```bash
# On the CURRENT host, in the directory with your docker-compose file.

# (optional but recommended) quiesce writes
docker compose stop testforge

# archive the named volume that holds /data
docker run --rm \
  -v testforge_data:/data \
  -v "$PWD":/backup \
  alpine tar czf /backup/testforge-backup.tgz -C /data .

# resume service
docker compose start testforge
```

> The volume name is `testforge_data` for the production compose file and
> `testforge-data` for the default `docker-compose.yml`. Confirm yours with
> `docker volume ls | grep testforge`.

You now have **`testforge-backup.tgz`** — the complete instance. Copy it to the
new server over a secure channel (e.g. `scp`).

### Alternative: online SQLite snapshot (no downtime)

If the image has `sqlite3` available you can take a hot, consistent snapshot of
just the DB without stopping:

```bash
docker compose exec testforge sh -c "sqlite3 /data/testforge.db \".backup '/data/backup.db'\""
docker compose cp testforge:/data/backup.db ./testforge-backup.db
```

Restore this single-file backup by placing it at `/data/testforge.db` on the
new instance (see step 2, "single-file" variant).

---

## 2. Restore on the new self-hosted instance

```bash
# On the NEW host, in your clone of the repo.

# 1. create the empty named volume (compose will also create it on first up)
docker volume create testforge_data

# 2. unpack the backup into it
docker run --rm \
  -v testforge_data:/data \
  -v "$PWD":/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/testforge-backup.tgz -C /data"

# 3. set your environment (.env) — see below — then start
docker compose -f docker-compose.prod.yml up -d --build
```

**Single-file variant** (if you used the `.backup` snapshot): replace step 2
with copying the file in as `testforge.db`:

```bash
docker run --rm -v testforge_data:/data -v "$PWD":/backup \
  alpine sh -c "rm -f /data/testforge.db* && cp /backup/testforge-backup.db /data/testforge.db"
```

That's it — the instance comes up with all data intact. Existing users log in
with their old passwords; existing API keys keep working.

---

## 3. Configure the new environment

Copy `.env.example` to `.env` and set values for the new host. Keys that matter
for a migration:

| Variable | What to do on migration |
| --- | --- |
| `AUTH_SECRET` | **Reuse the old value** to keep users' active sessions valid. If you change it, everyone simply re-logs in — passwords still work (see below). |
| `NEXT_PUBLIC_BASE_URL` | Set to the **new** domain (e.g. `https://testforge.example.com`). |
| `GOOGLE_/GITHUB_CLIENT_*` | If you use OAuth login, register the **new** domain's callback URL in the Google/GitHub app settings, or users can't sign in via provider. Email+password is unaffected. |
| `SMTP_URL` / `SMTP_FROM` | Point at your own mail sender if you want verification/reset/invite emails. |

### A note on `AUTH_SECRET` and sessions

Sessions are JWTs signed with `AUTH_SECRET`.

- **Same `AUTH_SECRET`** → existing session cookies remain valid across the move.
- **Different `AUTH_SECRET`** → old cookies are rejected and users just log in
  again. Their `passwordHash` is in the database, so **passwords are unchanged**.

API keys are hashed independently of `AUTH_SECRET`, so they keep working either
way.

---

## 4. Verify the migration

```bash
# integrity check on the restored DB
docker compose exec testforge sh -c "sqlite3 /data/testforge.db 'PRAGMA integrity_check;'"
# → should print: ok
```

Then log in through the UI and spot-check: a project, its cases, a test run's
results, the members list, and (as admin) the audit log.

---

## 5. Keeping periodic backups (recommended)

Run the step-1 archive on a schedule and keep the archives off-box:

```bash
# e.g. a nightly cron entry
0 2 * * * docker run --rm -v testforge_data:/data -v /srv/backups:/backup \
  alpine tar czf /backup/testforge-$(date +\%F).tgz -C /data .
```

Rotate old archives to taste, and store at least one copy off the server.

---

## Roadmap: portable JSON export/import

The database-copy method above is engine-specific (SQLite ↔ SQLite). A future
enhancement is an **admin-only full JSON export/import** that serializes every
table (preserving `cuid` IDs) and re-imports in dependency order. That would be
database-agnostic (e.g. SQLite → PostgreSQL) and expose the whole flow through
the UI. Until then, the volume/DB copy is the supported way to move an entire
instance, and it is complete.
