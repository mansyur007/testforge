import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { test, expect } from "@playwright/test";
import { E2E } from "./global-setup";

// L-03 Test cases as code (GitOps sync). Drives the real CLI as a subprocess
// (F-12 technique — the package is standalone ESM; running it under node keeps
// its "type":"module" honoured, unlike importing into this CJS-transformed
// spec).
//
// Isolation: `cases pull` pulls a WHOLE project, so this spec owns a private
// project per run (unique slug via Prisma) — sharing E2E.projectSlug would
// make it hostage to every other spec's cases.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const ROOT = path.join(__dirname, "..");
const BASE = "http://localhost:3456";
const db = new PrismaClient();

type Ctx = { slug: string; projectId: string; dir: string };

/** A private project (admin is OWNER) + a temp dir for its case files. */
async function makeCtx(tag: string): Promise<Ctx> {
  const admin = await db.user.findUniqueOrThrow({
    where: { email: E2E.email },
    select: { id: true },
  });
  const slug = `cac-${tag}-${Date.now()}`;
  const project = await db.project.create({
    data: {
      name: `Cases-as-code ${tag}`,
      slug,
      createdById: admin.id,
      members: { create: { userId: admin.id, role: "OWNER" } },
    },
    select: { id: true },
  });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `tf-cac-${tag}-`));
  return { slug, projectId: project.id, dir };
}

/** Seed cases under an "Auth/Login" suite so suite-path handling is exercised. */
async function seedCases(ctx: Ctx, titles: string[]) {
  const auth = await db.testSuite.create({
    data: { projectId: ctx.projectId, name: "Auth", order: 0 },
    select: { id: true },
  });
  const login = await db.testSuite.create({
    data: { projectId: ctx.projectId, parentId: auth.id, name: "Login", order: 0 },
    select: { id: true },
  });
  const out: { id: string; displayId: string }[] = [];
  for (let i = 0; i < titles.length; i++) {
    const c = await db.testCase.create({
      data: {
        projectId: ctx.projectId,
        suiteId: login.id,
        seq: i + 1,
        title: titles[i],
        priority: "HIGH",
        type: "FUNCTIONAL",
        tags: "smoke,auth",
        preconditions: "User exists\nand is logged out\n",
        stepsJson: JSON.stringify([
          { action: "Open /login", expected: "Form visible" },
          { action: "Submit credentials", expected: "Redirected" },
        ]),
        expectedResult: "User lands on the dashboard",
      },
      select: { id: true, seq: true },
    });
    out.push({ id: c.id, displayId: `TC-${ctx.slug.toUpperCase()}-00${i + 1}` });
  }
  await db.project.update({
    where: { id: ctx.projectId },
    data: { caseCounter: titles.length },
  });
  return out;
}

/** Run the CLI; returns {code, stdout, stderr} instead of throwing. */
// The token comes straight off the fixture rather than out of
// `e2e-results/.api-key`: that file is cwd-relative and was observed holding a
// token a second run had already revoked.
function cli(ctx: Ctx, args: string[]) {
  try {
    const stdout = execFileSync(
      "node",
      ["packages/cli/bin/testforge.js", "cases", ...args, "--project", ctx.slug, "--dir", ctx.dir],
      {
        cwd: ROOT,
        env: { ...process.env, TESTFORGE_URL: BASE, TESTFORGE_TOKEN: E2E.apiKey },
        encoding: "utf8",
      }
    );
    return { code: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string };
    return { code: err.status, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

const yamlFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...yamlFiles(p));
    else if (e.name.endsWith(".yaml")) out.push(p);
  }
  return out.sort();
};
const snapshot = (dir: string) =>
  yamlFiles(dir).map((f) => `${path.relative(dir, f)}\n${fs.readFileSync(f, "utf8")}`).join("\n---\n");

const revCount = (projectId: string) =>
  db.testCaseRevision.count({ where: { testCase: { projectId } } });

test(`TC-${TC}-54 Cases as code: deterministic pull; no-op push records no revisions`, async ({
  request,
}) => {
  const ctx = await makeCtx("pull");
  const seeded = await seedCases(ctx, [
    "Login with valid credentials",
    "Login with bad password",
  ]);

  const pull = cli(ctx, ["pull"]);
  expect(pull.code).toBe(0);
  expect(pull.stdout).toContain("2 case(s)");

  // Canonical layout: <suite path slugified>/<display id>.yaml
  const files = yamlFiles(ctx.dir).map((f) => path.relative(ctx.dir, f));
  expect(files).toEqual([
    path.join("auth", "login", `TC-${ctx.slug.toUpperCase()}-001.yaml`),
    path.join("auth", "login", `TC-${ctx.slug.toUpperCase()}-002.yaml`),
  ]);

  // Fixed field order + block scalars — this is what makes PR diffs reviewable.
  const first = fs.readFileSync(path.join(ctx.dir, files[0]), "utf8");
  expect(first).toBe(
    `id: TC-${ctx.slug.toUpperCase()}-001
title: Login with valid credentials
suite: Auth/Login
priority: HIGH
type: FUNCTIONAL
tags: [smoke, auth]
preconditions: |
  User exists
  and is logged out
steps:
  - action: Open /login
    expected: Form visible
  - action: Submit credentials
    expected: Redirected
expected: User lands on the dashboard
`
  );

  // AC: determinism — a second pull rewrites nothing.
  const before = snapshot(ctx.dir);
  expect(cli(ctx, ["pull"]).code).toBe(0);
  expect(snapshot(ctx.dir)).toBe(before);

  // AC 1: pull → push with no edits → zero new revisions. The CLI goes one
  // better than the work order's "unchanged" path — a case that matches the
  // lock isn't sent at all, so there's nothing for the server to no-op on.
  const revsBefore = await revCount(ctx.projectId);
  const push = cli(ctx, ["push"]);
  expect(push.code).toBe(0);
  expect(push.stdout).toContain("nothing to push");
  expect(await revCount(ctx.projectId)).toBe(revsBefore);

  // …and the server's own "unchanged" guard still holds for anything that
  // does re-send identical content (e.g. --force-local, or another client):
  // no revision spam.
  const rows = await db.testCase.findMany({
    where: { projectId: ctx.projectId },
    orderBy: { seq: "asc" },
    select: { rev: true, title: true },
  });
  const res = await request.post(`/api/v1/projects/${ctx.slug}/cases/sync`, {
    headers: { Authorization: `Bearer ${E2E.apiKey}` },
    data: {
      upserts: seeded.map((s, i) => ({
        displayId: s.displayId,
        baseRev: rows[i].rev,
        fields: { title: rows[i].title },
      })),
    },
  });
  expect((await res.json()).data.map((d: { status: string }) => d.status)).toEqual([
    "unchanged",
    "unchanged",
  ]);
  expect(await revCount(ctx.projectId)).toBe(revsBefore);
});

test(`TC-${TC}-55 Cases as code: local edit pushes and round-trips idempotently`, async () => {
  const ctx = await makeCtx("edit");
  await seedCases(ctx, ["Login with valid credentials"]);
  expect(cli(ctx, ["pull"]).code).toBe(0);

  // AC 2: edit the title locally → status says push → push → pull is a no-op.
  const file = yamlFiles(ctx.dir)[0];
  fs.writeFileSync(
    file,
    fs.readFileSync(file, "utf8").replace("title: Login with valid credentials", "title: Login happy path")
  );
  const status = cli(ctx, ["status"]);
  expect(status.code).toBe(0);
  expect(status.stdout).toMatch(/edited\s+clean\s+push/);

  const push = cli(ctx, ["push"]);
  expect(push.code).toBe(0);
  expect(push.stdout).toContain("updated");

  const c = await db.testCase.findFirstOrThrow({
    where: { projectId: ctx.projectId },
    select: { title: true, rev: true },
  });
  expect(c.title).toBe("Login happy path");

  // Idempotent: the push canonicalized the file and advanced the lock, so a
  // follow-up pull changes nothing and status is clean.
  const after = snapshot(ctx.dir);
  expect(cli(ctx, ["pull"]).code).toBe(0);
  expect(snapshot(ctx.dir)).toBe(after);
  expect(cli(ctx, ["status"]).stdout).toMatch(/clean\s+clean\s+clean/);
});

test(`TC-${TC}-56 Cases as code: conflict exits 1; --force-local and --force-server resolve`, async () => {
  const ctx = await makeCtx("conflict");
  const [seeded] = await seedCases(ctx, ["Login with valid credentials"]);
  expect(cli(ctx, ["pull"]).code).toBe(0);
  const file = yamlFiles(ctx.dir)[0];
  const displayId = `TC-${ctx.slug.toUpperCase()}-001`;

  const editLocal = (title: string) =>
    fs.writeFileSync(
      file,
      fs.readFileSync(file, "utf8").replace(/^title: .*$/m, `title: ${title}`)
    );
  const editServer = async (title: string) => {
    await db.testCase.update({ where: { id: seeded.id }, data: { title, rev: { increment: 1 } } });
    await db.testCaseRevision.create({
      data: {
        caseId: seeded.id,
        rev: (await db.testCase.findUniqueOrThrow({ where: { id: seeded.id }, select: { rev: true } })).rev,
        snapshotJson: "{}",
        changeSummary: "server edit",
      },
    });
  };

  // AC 3: both sides edit the title → push exits 1 naming the case + field.
  editLocal("Local title wins?");
  await editServer("Server title wins?");
  const conflicted = cli(ctx, ["push"]);
  expect(conflicted.code).toBe(1);
  expect(conflicted.stderr).toContain("1 conflict(s)");
  expect(conflicted.stderr).toContain(displayId);
  expect(conflicted.stderr).toContain("title");
  // Nothing was written — the server still holds its own edit.
  expect(
    (await db.testCase.findUniqueOrThrow({ where: { id: seeded.id }, select: { title: true } })).title
  ).toBe("Server title wins?");

  // --force-local: my file wins, and the lock is consistent afterwards.
  const forced = cli(ctx, ["push", "--force-local"]);
  expect(forced.code).toBe(0);
  expect(
    (await db.testCase.findUniqueOrThrow({ where: { id: seeded.id }, select: { title: true } })).title
  ).toBe("Local title wins?");
  expect(cli(ctx, ["status"]).stdout).toMatch(/clean\s+clean\s+clean/);

  // --force-server: a fresh conflict resolved the other way restores the file.
  editLocal("Discard me");
  await editServer("Server is authoritative");
  const restored = cli(ctx, ["push", "--force-server"]);
  expect(restored.code).toBe(0);
  expect(restored.stdout).toContain("restored from server");
  expect(fs.readFileSync(file, "utf8")).toContain("title: Server is authoritative");
  expect(cli(ctx, ["status"]).stdout).toMatch(/clean\s+clean\s+clean/);
});

test(`TC-${TC}-57 Cases as code: new YAML file gets an id assigned and renamed`, async () => {
  const ctx = await makeCtx("new");
  await seedCases(ctx, ["Login with valid credentials"]);
  expect(cli(ctx, ["pull"]).code).toBe(0);

  // AC 4: a hand-written file with no id → push assigns TC-<SLUG>-<n>, writes
  // it into the YAML, and renames <slug>.yaml → <displayId>.yaml.
  const draft = path.join(ctx.dir, "logout-clears-session.yaml");
  fs.writeFileSync(
    draft,
    `id:
title: Logout clears the session
suite: Auth/Logout
priority: MEDIUM
tags: [auth]
steps:
  - action: Click logout
    expected: Redirected to /login
`
  );
  const push = cli(ctx, ["push"]);
  expect(push.code).toBe(0);

  const displayId = `TC-${ctx.slug.toUpperCase()}-002`;
  expect(push.stdout).toContain(`${displayId} created`);
  expect(fs.existsSync(draft)).toBe(false); // renamed
  const target = path.join(ctx.dir, "auth", "logout", `${displayId}.yaml`);
  expect(fs.readFileSync(target, "utf8")).toContain(`id: ${displayId}`);

  // The suite path was auto-created server-side, and the case is real.
  const created = await db.testCase.findFirstOrThrow({
    where: { projectId: ctx.projectId, seq: 2 },
    select: { title: true, priority: true, tags: true, suite: { select: { name: true } } },
  });
  expect(created).toMatchObject({
    title: "Logout clears the session",
    priority: "MEDIUM",
    tags: "auth",
    suite: { name: "Logout" },
  });

  // Round-trip stays clean after the id assignment.
  const after = snapshot(ctx.dir);
  expect(cli(ctx, ["pull"]).code).toBe(0);
  expect(snapshot(ctx.dir)).toBe(after);
});

test(`TC-${TC}-58 Cases as code: batch applies clean items and reports the conflict`, async ({
  request,
}) => {
  const ctx = await makeCtx("batch");
  const seeded = await seedCases(ctx, ["Case A", "Case B", "Case C", "Case D", "Case E"]);

  // AC 5: item-level atomicity — one stale baseRev must not abort the batch.
  // Driven against the endpoint directly: the CLI catches conflicts before
  // sending, so this is the server-side contract (a mid-push server race).
  const rows = await db.testCase.findMany({
    where: { projectId: ctx.projectId },
    orderBy: { seq: "asc" },
    select: { rev: true },
  });
  const res = await request.post(`/api/v1/projects/${ctx.slug}/cases/sync`, {
    headers: { Authorization: `Bearer ${E2E.apiKey}` },
    data: {
      upserts: seeded.map((s, i) => ({
        displayId: s.displayId,
        baseRev: i === 2 ? rows[i].rev + 99 : rows[i].rev, // #3 is stale
        fields: { title: `Renamed ${i + 1}` },
      })),
    },
  });
  expect(res.status()).toBe(200);
  const data = (await res.json()).data as { displayId: string; status: string }[];
  expect(data.map((d) => d.status)).toEqual([
    "updated",
    "updated",
    "conflict",
    "updated",
    "updated",
  ]);

  // The four clean items really landed; the conflicting one is untouched.
  const titles = await db.testCase.findMany({
    where: { projectId: ctx.projectId },
    orderBy: { seq: "asc" },
    select: { title: true },
  });
  expect(titles.map((t) => t.title)).toEqual([
    "Renamed 1",
    "Renamed 2",
    "Case C",
    "Renamed 4",
    "Renamed 5",
  ]);
});

test.afterAll(async () => {
  // Drop every project this spec created (cases/suites cascade).
  await db.project.deleteMany({ where: { slug: { startsWith: "cac-" } } });
  await db.$disconnect();
});
