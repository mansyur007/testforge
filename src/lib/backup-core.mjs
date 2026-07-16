// L-05: one-file portable backup & restore.
//
// The design constraint that shapes everything here: a restore that half-succeeds
// is worse than one that refuses. Every guard below favours refusal, and the
// import runs inside a single transaction so a failure leaves the DB untouched.
//
// Plain ESM, not TypeScript, on purpose: `scripts/restore.mjs` must run under
// bare `node` against a fresh instance — a production image has no TS loader and
// no devDependencies. `backup.ts` is a typed wrapper over this file, so the UI
// path and the CLI path cannot drift apart.
//
// The archive (`.tfbackup`) is a zip:
//   manifest.json  { formatVersion, appVersion, prismaSchemaHash, createdAt,
//                    rowCounts: { [model]: n }, uploadsBytes, secretProbe }
//   db.json        { [modelName]: rows[] } — raw column values, FK-preserving
//   uploads/<storageKey...>  every file under TF_UPLOAD_DIR
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { Prisma } from "@prisma/client";
import { encrypt, decrypt } from "./crypto-core.mjs";

export const FORMAT_VERSION = 1;

// FK-safe insert order — the single constant both sides import. A model must
// appear after everything it references. This cannot be derived: it encodes
// which side of each relation holds the foreign key, so it is maintained by
// hand and defended by checkModelOrder() below.
export const MODEL_ORDER = [
  "Organization",
  "RoleDef",
  "User",
  "VerificationToken",
  "Invitation",
  "TwoFactorRecoveryCode",
  "Project",
  "ProjectMember",
  "Milestone",
  "TestSuite",
  "SharedStepGroup",
  "ConfigGroup",
  "ConfigOption",
  "Environment",
  "CustomFieldDef",
  "ResultStatusDef",
  "TestCase",
  "TestCaseRevision",
  "TestPlan",
  "TestRun",
  "TestRunResult",
  "Comment",
  "Attachment",
  "SavedView",
  "Dashboard",
  "DashboardWidget",
  "ShareLink",
  "BadgeToken",
  "ReportSchedule",
  "Requirement",
  "RequirementCase",
  "Webhook",
  "NotificationChannel",
  "Integration",
  "IssueLink",
  "ApiKey",
  "AuditLog",
];

const PROBE_PLAINTEXT = "tfprobe";
const UPLOAD_PREFIX = "uploads/";
const CHUNK = 500;

/**
 * Drift guard: a schema PR that adds a model without placing it in MODEL_ORDER
 * would silently drop that model from every backup. Fail the build instead —
 * `scripts/backup-selfcheck.mjs` runs this before `next build`.
 * @returns {{ missing: string[], unknown: string[] }}
 */
export function checkModelOrder() {
  const actual = Object.keys(Prisma.ModelName);
  return {
    missing: actual.filter((m) => !MODEL_ORDER.includes(m)),
    unknown: MODEL_ORDER.filter((m) => !actual.includes(m)),
  };
}

export function assertModelOrder() {
  const { missing, unknown } = checkModelOrder();
  if (missing.length || unknown.length) {
    throw new Error(
      "backup MODEL_ORDER is out of sync with the Prisma schema" +
        (missing.length
          ? `\n  missing (add in FK-safe position): ${missing.join(", ")}`
          : "") +
        (unknown.length ? `\n  no longer in schema: ${unknown.join(", ")}` : "")
    );
  }
}

/** Model name -> the Prisma client property ("TestCase" -> "testCase"). */
function clientKey(model) {
  return model[0].toLowerCase() + model.slice(1);
}

function modelMeta(model) {
  const m = Prisma.dmmf.datamodel.models.find((x) => x.name === model);
  if (!m) throw new Error(`Unknown model in MODEL_ORDER: ${model}`);
  return m;
}

/**
 * DateTime columns per model, read from the Prisma DMMF rather than a
 * hand-written map: dates round-trip through JSON as ISO strings, and deriving
 * the list means a new DateTime column can never be missed.
 */
function dateFields(model) {
  return modelMeta(model)
    .fields.filter((f) => f.kind === "scalar" && f.type === "DateTime")
    .map((f) => f.name);
}

/** Scalar (non-relation) column names — what actually gets exported. */
function scalarFields(model) {
  return modelMeta(model)
    .fields.filter((f) => f.kind === "scalar")
    .map((f) => f.name);
}

/**
 * Scalar FK columns pointing at the model's own table (TestSuite.parentId).
 * Rows referencing a sibling must be inserted after it, so these need a sort.
 */
function selfRefFields(model) {
  const meta = modelMeta(model);
  return meta.fields
    .filter((f) => f.kind === "object" && f.type === model)
    .flatMap((f) => f.relationFromFields ?? [])
    .filter(Boolean);
}

/**
 * Parents before children for self-referencing models. Rows whose parent is not
 * in the set (or is a cycle) are emitted last rather than dropped — the FK will
 * speak for itself if the data really is broken.
 */
function sortSelfRefs(model, rows) {
  const fks = selfRefFields(model);
  if (!fks.length || rows.length < 2) return rows;

  const byId = new Map(rows.map((r) => [r.id, r]));
  const out = [];
  const seen = new Set();
  const visit = (row, stack) => {
    if (seen.has(row.id) || stack.has(row.id)) return;
    stack.add(row.id);
    for (const fk of fks) {
      const parent = row[fk] ? byId.get(row[fk]) : null;
      if (parent) visit(parent, stack);
    }
    stack.delete(row.id);
    if (!seen.has(row.id)) {
      seen.add(row.id);
      out.push(row);
    }
  };
  for (const row of rows) visit(row, new Set());
  return out;
}

/** Restore raw JSON values to what Prisma expects (ISO strings -> Date). */
function reviveRow(model, row) {
  const dates = dateFields(model);
  const out = { ...row };
  for (const f of dates) if (out[f] != null) out[f] = new Date(out[f]);
  return out;
}

/**
 * Fingerprint of the datamodel. Hashing the DMMF rather than the raw
 * schema.prisma bytes is deliberate: it is available wherever the client is
 * (a built image may not ship the .prisma file), and it changes when the data
 * model changes — not when someone reflows a comment, which would otherwise
 * refuse every older backup for no reason.
 */
export function schemaHash() {
  const shape = Prisma.dmmf.datamodel.models
    .map((m) => ({
      name: m.name,
      fields: m.fields
        .filter((f) => f.kind === "scalar")
        .map((f) => `${f.name}:${f.type}${f.isRequired ? "!" : "?"}${f.isList ? "[]" : ""}`)
        .sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(shape))
    .digest("hex");
}

function uploadRootOf(opts) {
  return opts.uploadRoot ?? process.env.TF_UPLOAD_DIR ?? "./data/uploads";
}

/** Every file under `root`, as posix-style paths relative to it. */
async function walkUploads(root) {
  /** @type {string[]} */
  const found = [];
  async function walk(dir, rel) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return; // no uploads yet — an empty archive section is valid
    }
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      const key = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) await walk(abs, key);
      else if (e.isFile()) found.push(key);
    }
  }
  await walk(root, "");
  return found;
}

/**
 * Build a `.tfbackup` archive of the whole instance.
 * Secrets are never decrypted here — the archive holds only what the DB holds.
 * @param {{ db: any, uploadRoot?: string, appVersion?: string }} opts
 * @returns {Promise<Buffer>}
 */
export async function buildBackup(opts) {
  assertModelOrder();
  const { db } = opts;
  const root = uploadRootOf(opts);

  /** @type {Record<string, any[]>} */
  const data = {};
  /** @type {Record<string, number>} */
  const rowCounts = {};
  for (const model of MODEL_ORDER) {
    const rows = await db[clientKey(model)].findMany();
    data[model] = rows;
    rowCounts[model] = rows.length;
  }

  const zip = new AdmZip();
  zip.addFile("db.json", Buffer.from(JSON.stringify(data), "utf8"));

  let uploadsBytes = 0;
  for (const key of await walkUploads(root)) {
    const buf = await fs.readFile(path.join(root, key));
    uploadsBytes += buf.length;
    zip.addFile(UPLOAD_PREFIX + key, buf);
  }

  const manifest = {
    formatVersion: FORMAT_VERSION,
    appVersion: opts.appVersion ?? "unknown",
    prismaSchemaHash: schemaHash(),
    createdAt: new Date().toISOString(),
    rowCounts,
    uploadsBytes,
    // Lets restore tell "same TF_SECRET" from "different TF_SECRET" without
    // ever putting a real secret in the archive.
    secretProbe: encrypt(PROBE_PLAINTEXT),
  };
  zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));

  return zip.toBuffer();
}

/** A refusal the caller can show verbatim; never thrown once writes have begun. */
export class RestoreRefused extends Error {
  constructor(message) {
    super(message);
    this.name = "RestoreRefused";
  }
}

function readEntry(zip, name) {
  const entry = zip.getEntry(name);
  if (!entry) throw new RestoreRefused(`Archive is missing ${name} — not a TestForge backup?`);
  return zip.readFile(entry);
}

/**
 * Is this instance fresh enough to accept a restore? (≤1 user, 0 projects.)
 * @param {{ db: any }} opts
 */
export async function isFresh(db) {
  const [users, projects] = await Promise.all([
    db.user.count(),
    db.project.count(),
  ]);
  return users <= 1 && projects === 0;
}

/**
 * Restore an archive into `opts.db`.
 *
 * Guards run in order and all complete before the first write. Import happens in
 * one transaction; uploads are copied afterwards, so a DB failure leaves nothing
 * behind. cuids are globally unique, so no id is ever rewritten.
 *
 * `wipe` (CLI --force-wipe) erases the target first. The erase runs inside the
 * same transaction as the import, so the two are atomic: if the import fails,
 * the rollback puts the old data back rather than leaving an instance that is
 * both wiped and un-restored. It implies allowNonFresh — wiping a fresh
 * instance is a no-op anyway.
 *
 * @param {Buffer} buffer
 * @param {{ db: any, uploadRoot?: string, allowNonFresh?: boolean, wipe?: boolean }} opts
 * @returns {Promise<{ rowCounts: Record<string, number>, filesCopied: number,
 *   integrationsDeactivated: number, rowsWiped: number, elapsedMs: number,
 *   appVersion: string, createdAt: string }>}
 */
export async function restoreBackup(buffer, opts) {
  assertModelOrder();
  const { db } = opts;
  const root = uploadRootOf(opts);
  const started = Date.now();

  // --- Guards (all before any write) ---
  let zip;
  try {
    zip = new AdmZip(buffer);
    zip.getEntries();
  } catch (e) {
    throw new RestoreRefused(`Archive is not a readable zip: ${e.message}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(readEntry(zip, "manifest.json").toString("utf8"));
  } catch (e) {
    if (e instanceof RestoreRefused) throw e;
    throw new RestoreRefused(`manifest.json is corrupt: ${e.message}`);
  }

  if (typeof manifest.formatVersion !== "number" || manifest.formatVersion > FORMAT_VERSION) {
    throw new RestoreRefused(
      `Backup format version ${manifest.formatVersion} is newer than this instance supports (${FORMAT_VERSION}) — upgrade TestForge first.`
    );
  }

  const localHash = schemaHash();
  if (manifest.prismaSchemaHash !== localHash) {
    throw new RestoreRefused(
      `Backup is from schema ${String(manifest.prismaSchemaHash).slice(0, 12)}, this instance runs ${localHash.slice(0, 12)} — upgrade/downgrade the instance to match the backup first.`
    );
  }

  let data;
  try {
    data = JSON.parse(readEntry(zip, "db.json").toString("utf8"));
  } catch (e) {
    if (e instanceof RestoreRefused) throw e;
    throw new RestoreRefused(`db.json is corrupt or truncated: ${e.message}`);
  }
  for (const model of MODEL_ORDER) {
    if (data[model] != null && !Array.isArray(data[model]))
      throw new RestoreRefused(`db.json entry for ${model} is not a list`);
  }

  if (!opts.wipe && !opts.allowNonFresh && !(await isFresh(db))) {
    throw new RestoreRefused(
      "This instance already has data. Restore only runs on a fresh instance (at most one user and no projects). Use `node scripts/restore.mjs <file> --force-wipe` to erase this instance first."
    );
  }

  // Reject traversal before writing any file (same rule as storage.ts).
  const uploadEntries = zip
    .getEntries()
    .filter((e) => !e.isDirectory && e.entryName.startsWith(UPLOAD_PREFIX));
  const rootAbs = path.resolve(root);
  for (const e of uploadEntries) {
    const key = e.entryName.slice(UPLOAD_PREFIX.length);
    const dest = path.resolve(rootAbs, key);
    if (!key || path.isAbsolute(key) || (dest !== rootAbs && !dest.startsWith(rootAbs + path.sep)))
      throw new RestoreRefused(`Archive contains an unsafe upload path: ${e.entryName}`);
  }

  // TF_SECRET check: if the probe does not decrypt, every stored secret in this
  // archive is unreadable on this instance — import integrations disabled rather
  // than leaving them live and silently broken.
  let secretMatches = false;
  try {
    secretMatches =
      typeof manifest.secretProbe === "string" &&
      decrypt(manifest.secretProbe) === PROBE_PLAINTEXT;
  } catch {
    secretMatches = false;
  }

  // --- Import (one transaction: any throw ⇒ DB untouched) ---
  /** @type {Record<string, number>} */
  const rowCounts = {};
  let integrationsDeactivated = 0;
  let rowsWiped = 0;

  await db.$transaction(
    async (tx) => {
      // --force-wipe: erase in reverse FK order (children first), in the same
      // transaction as the import below.
      if (opts.wipe) {
        for (const model of [...MODEL_ORDER].reverse()) {
          const { count } = await tx[clientKey(model)].deleteMany({});
          rowsWiped += count;
        }
      }

      for (const model of MODEL_ORDER) {
        const raw = data[model] ?? [];
        if (!raw.length) {
          rowCounts[model] = 0;
          continue;
        }
        const cols = new Set(scalarFields(model));
        let rows = raw.map((r) => {
          const picked = {};
          for (const [k, v] of Object.entries(r)) if (cols.has(k)) picked[k] = v;
          return reviveRow(model, picked);
        });
        rows = sortSelfRefs(model, rows);

        if (model === "Integration" && !secretMatches) {
          rows = rows.map((r) => ({ ...r, active: false }));
          integrationsDeactivated += rows.length;
        }

        for (let i = 0; i < rows.length; i += CHUNK) {
          await tx[clientKey(model)].createMany({ data: rows.slice(i, i + CHUNK) });
        }
        rowCounts[model] = rows.length;
      }
    },
    { timeout: 120_000, maxWait: 15_000 }
  );

  // --- Files (after the DB is committed; rows without files are inert) ---
  let filesCopied = 0;
  for (const e of uploadEntries) {
    const dest = path.join(rootAbs, e.entryName.slice(UPLOAD_PREFIX.length));
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, zip.readFile(e));
    filesCopied++;
  }

  return {
    rowCounts,
    filesCopied,
    integrationsDeactivated,
    rowsWiped,
    elapsedMs: Date.now() - started,
    appVersion: manifest.appVersion ?? "unknown",
    createdAt: manifest.createdAt ?? "unknown",
  };
}
