# Self-Hosted Migration & Full Backup

This guide explains how to take a **complete copy of a TestForge instance** and
restore it on your own server — so if the hosted site (e.g.
`testforge.emha.space`) ever goes away, you can keep all of your data on
infrastructure you control.

> **Scope:** whole-instance. One backup contains **everything** — all
> organizations, users, projects, suites, cases, runs & results, milestones,
> API keys, webhooks, and the audit log. There is no data left behind.

## Which method should I use?

| | [One-file backup](#portable-one-file-backup-tfbackup) (`.tfbackup`) | [Volume / DB copy](#1-back-up-the-source-instance) |
| --- | --- | --- |
| How | **Settings → Backup & restore** in the app | `docker` + `tar` on the host |
| Needs shell access | No, for the backup | Yes |
| Carries attachments | Yes | Yes |
| SQLite → PostgreSQL | Yes — it re-imports row by row | No, engine-specific |
| Requires the same schema version | Yes (it refuses otherwise) | Yes |

**Use the one-file backup** unless you specifically want a byte-for-byte volume
snapshot. Both are complete; they differ in mechanism, not coverage.

---

## Portable one-file backup (`.tfbackup`)

A `.tfbackup` is a zip holding `db.json` (every table, FK-preserving, `cuid`s
intact), every uploaded file, and a `manifest.json` describing what is inside.

### Create one

**Settings → Backup & restore → Download backup** (organization admins only).
The download is the whole instance, so treat the file as a secret — see the
warning above.

### Restore it

Onto a **fresh instance** (at most one user, no projects) — the same card offers
an upload form, or from a shell:

```bash
# On the NEW instance, with DATABASE_URL / TF_UPLOAD_DIR / TF_SECRET set
# the same way the app runs.
node scripts/restore.mjs testforge-acme-20260716-1432.tfbackup
```

To replace an instance that **already has data**, erase it first — the script
asks for confirmation before it does:

```bash
node scripts/restore.mjs backup.tfbackup --force-wipe        # prompts
node scripts/restore.mjs backup.tfbackup --force-wipe --yes  # no prompt (CI)
```

The wipe and the import run in **one transaction**: if the import fails, the
rollback puts the old data back rather than leaving you with neither.

### What it refuses, and why

A restore that half-succeeds is worse than one that refuses, so every guard runs
before the first write:

| Situation | Result |
| --- | --- |
| The instance already has data | Refused — use `--force-wipe` |
| The backup came from a different schema version | Refused — run the matching TestForge version first |
| The zip or `db.json` is corrupt/truncated | Refused, database untouched |
| A `formatVersion` newer than this instance knows | Refused — upgrade first |

### `TF_SECRET` and stored credentials

Integration credentials (F-07) are encrypted with `TF_SECRET`. The backup stores
them **still encrypted** — nothing is ever decrypted into the archive.

- **Same `TF_SECRET`** on the new instance → integrations keep working.
- **Different `TF_SECRET`** → their credentials cannot be read, so integrations
  are imported **inactive** and the restore summary counts them. Nothing else is
  affected; re-enter the credentials to re-enable each one.

Reuse `TF_SECRET` (alongside `AUTH_SECRET`) to avoid this entirely.

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
| `TF_LDAP_*` | If you authenticate against a directory, check the **new** host can actually reach `TF_LDAP_URL` (firewall/VPN rules often follow the old IP) and that its CA is trusted. Nothing about LDAP is stored in the database, so no data moves — but a directory that is unreachable from the new host means LDAP users can't log in. Local accounts still can. |

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

## Portable backups on a schedule

The volume copy above is engine-specific (SQLite ↔ SQLite). For an
engine-agnostic archive — including SQLite → PostgreSQL — take a
[`.tfbackup`](#portable-one-file-backup-tfbackup) instead. It is a plain
authenticated GET, so a cron entry can pull one off-box:

```bash
# nightly, using an organization admin's session cookie
0 2 * * * curl -fsS --cookie "tf_session=$TF_SESSION" \
  https://testforge.example.com/api/admin/backup \
  -o /srv/backups/testforge-$(date +\%F).tfbackup
```

Keep at least one copy off the server, and rotate old archives to taste.
