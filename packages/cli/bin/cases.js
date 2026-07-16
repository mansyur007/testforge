// testforge cases pull|status|push — test cases as code (L-03).
// Two-way sync between a folder of canonical YAML files and TestForge, with
// a `.testforge.lock` base snapshot enabling classic 3-way merging. Every
// failure mode is "exit 1 with a report", never "silently overwrote".
//
// The `yaml` package is used for PARSING only — emission is hand-rolled so
// pull output is byte-deterministic (fixed field order, fixed scalar styles),
// which is what makes PR diffs reviewable. Determinism is an AC.

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

const LOCK_FILE = ".testforge.lock";
const FIELD_ORDER = [
  "title",
  "suite",
  "priority",
  "type",
  "tags",
  "preconditions",
  "steps",
  "expected",
];

function fail(msg) {
  process.stderr.write(`error: ${msg}\n`);
  process.exit(1);
}

function config(flags) {
  const url = (flags.url || process.env.TESTFORGE_URL || "").replace(/\/$/, "");
  const token = flags.token || process.env.TESTFORGE_TOKEN || "";
  if (!url) fail("no TestForge URL. Pass --url or set TESTFORGE_URL.");
  if (!token) fail("no API token. Pass --token or set TESTFORGE_TOKEN.");
  const project = flags.project;
  if (!project) fail("--project <slug> is required.");
  const dir = path.resolve(String(flags.dir || "tests"));
  return { url, token, project, dir };
}

async function api(cfg, method, apiPath, body) {
  let res;
  try {
    res = await fetch(`${cfg.url}/api/v1${apiPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (e) {
    fail(`request failed: ${e.message}`);
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok)
    fail(
      `${method} ${apiPath}: ${payload?.error?.message || payload?.error || `HTTP ${res.status}`}`
    );
  return payload;
}

// ── canonical YAML emission ─────────────────────────────────────────────────

function scalar(value, indent) {
  const s = String(value);
  if (s.includes("\n")) {
    // `|` keeps the trailing newline, `|-` strips it — pick whichever parses
    // back to EXACTLY the input, so pull→push round-trips are no-ops.
    const keep = s.endsWith("\n");
    const lines = (keep ? s.slice(0, -1) : s).split("\n");
    // A leading space (or a blank first line) would need an explicit block
    // indentation indicator; quoting is simpler and still deterministic.
    if (/^\s/.test(lines[0] ?? "")) return JSON.stringify(s);
    const pad = " ".repeat(indent + 2);
    const body = lines.map((line) => (line ? pad + line : "")).join("\n");
    return (keep ? "|" : "|-") + "\n" + body;
  }
  // Plain when YAML allows it; JSON double-quoting (valid YAML) otherwise.
  if (s === "" || /^[\s#&*?|>%@`"'{[\]},-]|[:#]\s|\s$|^(true|false|null|yes|no|on|off|~)$|^[\d.+-]/i.test(s))
    return JSON.stringify(s);
  return s;
}

function emitCase(c) {
  const lines = [`id: ${c.id ?? ""}`.trimEnd()];
  for (const key of FIELD_ORDER) {
    const v = c[key];
    if (key === "steps") {
      lines.push("steps:");
      for (const s of v ?? []) {
        if (s.shared) lines.push(`  # shared: ${s.shared}`);
        lines.push(`  - action: ${scalar(s.action ?? "", 4)}`);
        if (s.expected) lines.push(`    expected: ${scalar(s.expected, 4)}`);
      }
      continue;
    }
    if (key === "tags") {
      if (v?.length)
        lines.push(`tags: [${v.map((t) => scalar(t, 0)).join(", ")}]`);
      continue;
    }
    if (v == null || v === "") {
      if (key === "title") lines.push(`title: ${scalar("", 0)}`);
      continue;
    }
    lines.push(`${key}: ${scalar(v, 0)}`);
  }
  return lines.join("\n") + "\n";
}

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "suite";

function filePathFor(dir, suitePath, name) {
  const parts = suitePath ? suitePath.split("/").map(slugify) : [];
  return path.join(dir, ...parts, `${name}.yaml`);
}

// ── local & server state ────────────────────────────────────────────────────

async function readLock(dir) {
  try {
    const parsed = JSON.parse(await readFile(path.join(dir, LOCK_FILE), "utf8"));
    // Normalize so `lock.cases` is always writable — a hand-edited or
    // truncated lock must not crash the merge.
    return { ...parsed, cases: parsed?.cases ?? {} };
  } catch {
    return { cases: {} };
  }
}

async function writeLock(dir, cfg, cases) {
  const sorted = {};
  for (const key of Object.keys(cases).sort()) sorted[key] = cases[key];
  await writeFile(
    path.join(dir, LOCK_FILE),
    JSON.stringify(
      { project: cfg.project, url: cfg.url, pulledAt: new Date().toISOString(), cases: sorted },
      null,
      2
    ) + "\n"
  );
}

async function walkYaml(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walkYaml(p)));
    else if (e.name.endsWith(".yaml") || e.name.endsWith(".yml")) out.push(p);
  }
  return out;
}

/** Parse a local YAML file into the canonical field shape. */
function parseLocal(content, file) {
  let doc;
  try {
    doc = YAML.parse(content);
  } catch (e) {
    fail(`${file}: invalid YAML — ${e.message}`);
  }
  if (!doc || typeof doc !== "object") fail(`${file}: not a YAML mapping`);
  return {
    id: doc.id ? String(doc.id) : null,
    title: String(doc.title ?? ""),
    suite: doc.suite ? String(doc.suite) : "",
    priority: doc.priority ? String(doc.priority).toUpperCase() : "",
    type: doc.type ? String(doc.type).toUpperCase() : "",
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    preconditions: doc.preconditions ? String(doc.preconditions) : "",
    steps: Array.isArray(doc.steps)
      ? doc.steps.map((s) => ({
          action: String(s?.action ?? ""),
          expected: String(s?.expected ?? ""),
        }))
      : [],
    expected: doc.expected ? String(doc.expected) : "",
  };
}

/** GET every case + the suite tree; normalize to the canonical shape. */
async function fetchServer(cfg) {
  const suites = (await api(cfg, "GET", `/projects/${cfg.project}/suites`)).data;
  const byId = new Map(suites.map((s) => [s.id, s]));
  const pathOf = (suiteId) => {
    const parts = [];
    for (let s = byId.get(suiteId); s; s = byId.get(s.parentId)) parts.unshift(s.name);
    return parts.join("/");
  };

  const cases = new Map();
  let cursor = null;
  do {
    const page = await api(
      cfg,
      "GET",
      `/projects/${cfg.project}/cases?limit=200${cursor ? `&cursor=${cursor}` : ""}`
    );
    for (const c of page.data) {
      // Shared-step references pull EXPANDED with a `# shared:` marker; the
      // doc warns that pushing such a file back inlines the steps.
      const steps = (c.stepsExpanded ?? c.steps ?? []).map((s) => ({
        action: String(s.action ?? ""),
        expected: String(s.expected ?? ""),
        ...(s.fromShared ? { shared: s.fromShared.title } : {}),
      }));
      cases.set(c.displayId, {
        id: c.displayId,
        caseId: c.id,
        rev: c.rev,
        title: c.title,
        suite: c.suiteId ? pathOf(c.suiteId) : "",
        priority: c.priority,
        type: c.type,
        tags: c.tags ? c.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        preconditions: c.preconditions ?? "",
        steps,
        expected: c.expectedResult ?? "",
      });
    }
    cursor = page.nextCursor;
  } while (cursor);
  return cases;
}

/** Which canonical fields differ (steps compared index-wise, like CaseHistory). */
function diffFields(a, b) {
  const out = [];
  for (const key of ["title", "suite", "priority", "type", "preconditions", "expected"])
    if (String(a[key] ?? "") !== String(b[key] ?? "")) out.push(key);
  if (a.tags.join(",") !== b.tags.join(",")) out.push("tags");
  const n = Math.max(a.steps.length, b.steps.length);
  for (let i = 0; i < n; i++) {
    const sa = a.steps[i];
    const sb = b.steps[i];
    if (!sa || !sb || sa.action !== sb.action || sa.expected !== sb.expected) {
      out.push(`steps[${i + 1}]`);
      break;
    }
  }
  return out;
}

/** Gather the 3-way state: lock (base) × local files × server. */
async function gatherState(cfg) {
  const lock = await readLock(cfg.dir);
  const server = await fetchServer(cfg);
  const files = await walkYaml(cfg.dir);
  const local = new Map(); // displayId (or file path for new) → {file, content, hash, parsed}
  const newLocal = [];
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const parsed = parseLocal(content, file);
    const entry = { file, content, hash: sha256(content), parsed };
    if (parsed.id) local.set(parsed.id, entry);
    else newLocal.push(entry);
  }
  return { lock, server, local, newLocal };
}

function classify(displayId, { lock, server, local }) {
  const base = lock.cases[displayId];
  const loc = local.get(displayId);
  const srv = server.get(displayId);
  if (!srv) return base ? "deleted-remote" : "new-local"; // id in a file the server doesn't know
  if (!loc) return base ? "deleted-local" : "pull";
  // An id with no lock entry (hand-written, or the lock never committed)
  // has no base to merge against — refuse to guess which side is newer.
  if (!base) return "CONFLICT";
  const localChanged = loc.hash !== base.hash;
  const serverChanged = srv.rev !== base.rev;
  if (localChanged && serverChanged) return "CONFLICT";
  if (localChanged) return "push";
  if (serverChanged) return "pull";
  return "clean";
}

const allIds = ({ lock, server, local }) =>
  [...new Set([
    ...Object.keys(lock.cases),
    ...server.keys(),
    ...local.keys(),
  ])].sort();

// ── commands ────────────────────────────────────────────────────────────────

async function pull(cfg, flags) {
  const { lock, server, local } = await gatherState(cfg);

  if (!flags["force-server"]) {
    const dirty = [...server.keys()].filter((id) => {
      const loc = local.get(id);
      return loc && loc.hash !== lock.cases[id]?.hash;
    });
    if (dirty.length) {
      process.stderr.write(
        `pull: refusing to overwrite ${dirty.length} locally edited file(s):\n` +
          dirty.map((d) => `  ${d} (${local.get(d).file})\n`).join("") +
          `Push your changes first, or re-run with --force-server to discard them.\n`
      );
      process.exit(1);
    }
  }

  const lockCases = {};
  let written = 0;
  for (const [displayId, c] of [...server.entries()].sort()) {
    const target = filePathFor(cfg.dir, c.suite, displayId);
    const content = emitCase(c);
    await mkdir(path.dirname(target), { recursive: true });
    const existing = local.get(displayId);
    if (!existing || existing.content !== content || existing.file !== target) {
      await writeFile(target, content);
      written++;
    }
    lockCases[displayId] = { hash: sha256(content), rev: c.rev };
  }
  await writeLock(cfg.dir, cfg, lockCases);

  const gone = [...local.keys()].filter((id) => !server.has(id));
  for (const id of gone)
    process.stdout.write(`pull: ${id} was deleted on the server — ${local.get(id).file} kept locally\n`);
  process.stdout.write(`pull: ${server.size} case(s), ${written} file(s) written → ${cfg.dir}\n`);
}

async function status(cfg) {
  const state = await gatherState(cfg);
  const rows = [["CASE", "LOCAL", "SERVER", "VERDICT"]];
  for (const id of allIds(state)) {
    const base = state.lock.cases[id];
    const loc = state.local.get(id);
    const srv = state.server.get(id);
    rows.push([
      id,
      !loc ? "missing" : loc.hash === base?.hash ? "clean" : "edited",
      !srv ? "deleted" : srv.rev === base?.rev ? "clean" : `rev ${base?.rev ?? "?"}→${srv.rev}`,
      classify(id, state),
    ]);
  }
  for (const e of state.newLocal)
    rows.push([path.basename(e.file), "new", "—", "new-local"]);
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => String(r[i]).length)));
  for (const r of rows)
    process.stdout.write(r.map((cell, i) => String(cell).padEnd(widths[i])).join("  ") + "\n");
}

async function push(cfg, flags) {
  const state = await gatherState(cfg);
  const { lock, server, local, newLocal } = state;

  const upserts = [];
  const sources = []; // parallel to upserts: local entry (or null for force-server handling)
  const conflicts = [];
  const notes = [];

  for (const id of allIds(state)) {
    const verdict = classify(id, state);
    const loc = local.get(id);
    const srv = server.get(id);
    if (verdict === "push" || (verdict === "CONFLICT" && flags["force-local"])) {
      upserts.push({
        displayId: id,
        // --force-local deliberately bases on the server's current rev so the
        // push wins; a normal push bases on the lock and lets the server
        // detect races.
        baseRev: flags["force-local"] && verdict === "CONFLICT" ? srv.rev : lock.cases[id]?.rev ?? srv.rev,
        fields: toFields(loc.parsed),
      });
      sources.push(loc);
    } else if (verdict === "CONFLICT" && flags["force-server"]) {
      const target = filePathFor(cfg.dir, srv.suite, id);
      const content = emitCase(srv);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
      lock.cases[id] = { hash: sha256(content), rev: srv.rev };
      notes.push(`${id}: restored from server (--force-server)`);
    } else if (verdict === "CONFLICT") {
      conflicts.push({ id, fields: diffFields(loc.parsed, srv), file: loc.file });
    } else if (verdict === "pull") {
      notes.push(`${id}: changed on server — will pull`);
    } else if (verdict === "deleted-remote") {
      notes.push(`${id}: deleted on server — local file kept (never auto-deleted)`);
    } else if (verdict === "deleted-local") {
      notes.push(`${id}: file missing locally — re-run \`cases pull\` to restore`);
    }
  }
  for (const e of newLocal) {
    if (!e.parsed.title) fail(`${e.file}: new case needs a title`);
    upserts.push({ fields: toFields(e.parsed) });
    sources.push(e);
  }

  for (const n of notes) process.stdout.write(`push: ${n}\n`);
  if (conflicts.length) {
    process.stderr.write(`push: ${conflicts.length} conflict(s) — both sides changed:\n`);
    for (const c of conflicts)
      process.stderr.write(`  ${c.id} (${c.file}): ${c.fields.join(", ") || "content"}\n`);
    process.stderr.write(
      `Resolve with --force-local (your files win) or --force-server (server wins).\n`
    );
    process.exit(1);
  }

  if (!upserts.length) {
    await writeLock(cfg.dir, cfg, lock.cases);
    process.stdout.write("push: nothing to push\n");
    return;
  }

  const res = await api(cfg, "POST", `/projects/${cfg.project}/cases/sync`, { upserts });
  let failed = 0;
  const applied = [];
  for (let i = 0; i < res.data.length; i++) {
    const item = res.data[i];
    if (item.status === "conflict" || item.status === "invalid") {
      failed++;
      process.stderr.write(
        `push: ${item.displayId} → ${item.status}${item.error ? ` (${item.error})` : ""}\n`
      );
      continue;
    }
    applied.push({ item, src: sources[i] });
    process.stdout.write(`push: ${item.displayId} ${item.status}\n`);
  }

  // The server is authoritative once it has written: it may have applied
  // defaults the file omitted (priority/type) or normalized a suite path, so
  // re-fetch and persist ITS canonical bytes. Writing the local bytes instead
  // would leave the lock hash disagreeing with what the next `pull` emits —
  // i.e. a pull straight after a push would rewrite files (breaks AC 2).
  if (applied.length) {
    const fresh = await fetchServer(cfg);
    for (const { item, src } of applied) {
      const srv = fresh.get(item.displayId);
      if (!srv) continue;
      const canonical = emitCase(srv);
      const target = filePathFor(cfg.dir, srv.suite, item.displayId);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, canonical);
      // First push of a new case assigns its id: <slug>.yaml → <displayId>.yaml.
      if (path.resolve(src.file) !== path.resolve(target))
        await rm(src.file, { force: true });
      lock.cases[item.displayId] = { hash: sha256(canonical), rev: srv.rev };
    }
  }
  await writeLock(cfg.dir, cfg, lock.cases);
  if (failed) {
    process.stderr.write(`push: ${failed} item(s) failed — see above\n`);
    process.exit(1);
  }
}

function toFields(p) {
  return {
    title: p.title,
    suite: p.suite,
    ...(p.priority ? { priority: p.priority } : {}),
    ...(p.type ? { type: p.type } : {}),
    tags: p.tags,
    preconditions: p.preconditions,
    steps: p.steps.map((s) => ({ action: s.action, expected: s.expected })),
    expected: p.expected,
  };
}

export async function cmdCases(positional, flags) {
  const sub = positional[0];
  const cfg = config(flags);
  if (sub === "pull") return pull(cfg, flags);
  if (sub === "status") return status(cfg);
  if (sub === "push") return push(cfg, flags);
  fail(`unknown subcommand "cases ${sub ?? ""}". Use: cases pull|status|push`);
}
