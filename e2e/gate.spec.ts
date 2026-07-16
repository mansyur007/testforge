import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { test, expect, type Page } from "@playwright/test";
import { E2E } from "./global-setup";

// L-02 CI quality gates. Policy is saved once through the real UI (AC 5);
// runs are seeded directly via Prisma with a UNIQUE source per invocation —
// the baseline lookup is source-scoped, so this isolates the spec from every
// other spec's runs and from previous local reruns without any cleanup.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();
const ROOT = path.join(__dirname, "..");
const db = new PrismaClient();

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

type Fixture = {
  projectId: string;
  adminId: string;
  smokeCase: { id: string; seq: number }; // tagged "smoke,login"
  otherCase: { id: string; seq: number };
};

async function fixture(): Promise<Fixture> {
  const project = await db.project.findUniqueOrThrow({
    where: { slug: E2E.projectSlug },
    select: { id: true },
  });
  const admin = await db.user.findUniqueOrThrow({
    where: { email: E2E.email },
    select: { id: true },
  });
  const [smokeCase, otherCase] = await Promise.all([
    db.testCase.findFirstOrThrow({
      where: { projectId: project.id, seq: 1 },
      select: { id: true, seq: true },
    }),
    db.testCase.findFirstOrThrow({
      where: { projectId: project.id, seq: 4 },
      select: { id: true, seq: true },
    }),
  ]);
  return { projectId: project.id, adminId: admin.id, smokeCase, otherCase };
}

let seq = 0;
async function seedRun(
  f: Fixture,
  source: string,
  results: { caseId: string; status: string }[]
) {
  seq += 1;
  return db.testRun.create({
    data: {
      projectId: f.projectId,
      name: `Gate ${source} #${seq}`,
      source,
      status: "COMPLETED",
      // Explicit spacing so "most recent baseline" ordering is deterministic
      // even when two creates land in the same millisecond.
      createdAt: new Date(Date.now() + seq * 1000),
      completedAt: new Date(Date.now() + seq * 1000),
      createdById: f.adminId,
      results: { create: results.map((r) => ({ ...r, caseRev: 1 })) },
    },
  });
}

const setPolicy = (projectId: string, policy: object | null) =>
  db.project.update({
    where: { id: projectId },
    data: { gatePolicyJson: policy ? JSON.stringify(policy) : null },
  });

test(`TC-${TC}-51 Gate: 404 without policy; UI save; pass-rate + mute flip`, async ({
  page,
  browser,
}) => {
  const f = await fixture();
  const source = `GATE-A-${Date.now()}`;
  await setPolicy(f.projectId, null);
  await login(page, E2E.email, E2E.password);

  // AC 5a: no policy configured → 404.
  const none = await page.request.get(`/api/v1/projects/${E2E.projectSlug}/gate`);
  expect(none.status()).toBe(404);
  expect((await none.json()).error.message).toBe("No gate policy configured");

  // Save {minPassRate: 95} through the real UI. The click resolves before the
  // server action commits, so poll the DB for the persisted policy — a value
  // assertion on the input would pass trivially with what we just typed.
  await page.goto(`/projects/${E2E.projectSlug}/fields`);
  await page.fill('[data-testid="gate-min-pass-rate"]', "95");
  await page.click('[data-testid="gate-save"]');
  await expect
    .poll(
      async () =>
        (
          await db.project.findUniqueOrThrow({
            where: { id: f.projectId },
            select: { gatePolicyJson: true },
          })
        ).gatePolicyJson,
      { timeout: 10_000 }
    )
    .toContain("95");

  // AC 1: 1 FAIL + 1 PASS → 50.0% < 95 → gate FAIL.
  const run = await seedRun(f, source, [
    { caseId: f.smokeCase.id, status: "FAILED" },
    { caseId: f.otherCase.id, status: "PASSED" },
  ]);
  const failing = await (
    await page.request.get(
      `/api/v1/projects/${E2E.projectSlug}/gate?run=${run.id}`
    )
  ).json();
  expect(failing.pass).toBe(false);
  expect(failing.checks).toEqual([
    expect.objectContaining({ name: "minPassRate", actual: "50.0%", pass: false }),
  ]);

  // The settings-page preview shows the same verdict (this run is latest).
  await page.goto(`/projects/${E2E.projectSlug}/fields`);
  await expect(page.locator('[data-testid="gate-preview-verdict"]')).toHaveText(
    "gate: FAIL"
  );

  // Mute the failing case → the SAME call flips to PASS (F-21 consistency).
  await db.testCase.update({
    where: { id: f.smokeCase.id },
    data: { mutedAt: new Date(), mutedReason: "gate e2e" },
  });
  try {
    const muted = await (
      await page.request.get(
        `/api/v1/projects/${E2E.projectSlug}/gate?run=${run.id}`
      )
    ).json();
    expect(muted.pass).toBe(true);
    expect(muted.checks[0].actual).toBe("100.0%");
  } finally {
    await db.testCase.update({
      where: { id: f.smokeCase.id },
      data: { mutedAt: null, mutedReason: null },
    });
  }

  // AC 5b: a MEMBER gets a read-only card — no save button, inputs disabled
  // (and the action itself re-checks project.admin server-side).
  const b = await browser.newContext();
  const memberPage = await b.newPage();
  await login(memberPage, E2E.reviewerEmail, E2E.password);
  await memberPage.goto(`/projects/${E2E.projectSlug}/fields`);
  await expect(memberPage.locator('[data-testid="gate-min-pass-rate"]')).toBeDisabled();
  await expect(memberPage.locator('[data-testid="gate-save"]')).toHaveCount(0);
  await b.close();
});

test(`TC-${TC}-52 Gate: maxNewFailures — vacuous, regression, fixed`, async ({
  page,
}) => {
  const f = await fixture();
  const source = `GATE-B-${Date.now()}`;
  await setPolicy(f.projectId, { maxNewFailures: 0 });
  await login(page, E2E.email, E2E.password);
  const verdict = async (runId: string) =>
    (
      await page.request.get(
        `/api/v1/projects/${E2E.projectSlug}/gate?run=${runId}`
      )
    ).json();

  // First-ever run of this source → vacuous PASS with the note.
  const run1 = await seedRun(f, source, [
    { caseId: f.smokeCase.id, status: "PASSED" },
    { caseId: f.otherCase.id, status: "PASSED" },
  ]);
  const v1 = await verdict(run1.id);
  expect(v1.pass).toBe(true);
  expect(v1.checks[0]).toEqual(
    expect.objectContaining({ actual: "0", note: "no previous run" })
  );

  // One regression vs the all-pass baseline → FAIL listing 1 + display id.
  const run2 = await seedRun(f, source, [
    { caseId: f.smokeCase.id, status: "FAILED" },
    { caseId: f.otherCase.id, status: "PASSED" },
  ]);
  const v2 = await verdict(run2.id);
  expect(v2.pass).toBe(false);
  expect(v2.checks[0].actual).toBe("1");
  expect(v2.checks[0].note).toContain("TC-E2E-001");

  // Regression fixed in the next run (FAILED→PASSED is FIXED, not new) → PASS.
  const run3 = await seedRun(f, source, [
    { caseId: f.smokeCase.id, status: "PASSED" },
    { caseId: f.otherCase.id, status: "PASSED" },
  ]);
  expect((await verdict(run3.id)).pass).toBe(true);
});

test(`TC-${TC}-53 Gate: requiredTags + typo guard; CLI exit codes`, async ({
  page,
}) => {
  const f = await fixture();
  const source = `GATE-C-${Date.now()}`;
  await login(page, E2E.email, E2E.password);

  // Failing smoke-tagged case → FAIL naming its display id.
  await setPolicy(f.projectId, { requiredTags: ["smoke"] });
  const run = await seedRun(f, source, [
    { caseId: f.smokeCase.id, status: "FAILED" },
    { caseId: f.otherCase.id, status: "PASSED" },
  ]);
  const v = await (
    await page.request.get(
      `/api/v1/projects/${E2E.projectSlug}/gate?run=${run.id}`
    )
  ).json();
  expect(v.pass).toBe(false);
  expect(v.checks[0]).toEqual(
    expect.objectContaining({
      name: "requiredTag:smoke",
      pass: false,
      note: expect.stringContaining("TC-E2E-001"),
    })
  );

  // A tag matching zero cases must FAIL (typo guard), never gate green.
  await setPolicy(f.projectId, { requiredTags: ["nosuchtag"] });
  const typo = await (
    await page.request.get(
      `/api/v1/projects/${E2E.projectSlug}/gate?run=${run.id}`
    )
  ).json();
  expect(typo.pass).toBe(false);
  expect(typo.checks[0].expected).toBe(">=1 case tagged nosuchtag");

  // AC 4: CLI subprocess — exit 1 on FAIL (run above is latest), 0 on PASS.
  await setPolicy(f.projectId, { requiredTags: ["smoke"] });
  const apiKey = fs
    .readFileSync(path.join(ROOT, "e2e-results", ".api-key"), "utf8")
    .trim();
  const cli = (expectExit: number) => {
    try {
      const out = execFileSync(
        "node",
        ["packages/cli/bin/testforge.js", "gate", "--project", E2E.projectSlug],
        {
          cwd: ROOT,
          env: {
            ...process.env,
            TESTFORGE_URL: "http://localhost:3456",
            TESTFORGE_TOKEN: apiKey,
          },
          encoding: "utf8",
        }
      );
      expect(expectExit).toBe(0);
      return out;
    } catch (e) {
      const err = e as { status: number; stdout: string };
      expect(err.status).toBe(expectExit);
      return err.stdout;
    }
  };

  const failOut = cli(1);
  expect(failOut).toContain("CHECK");
  expect(failOut).toContain("gate: FAIL");

  await seedRun(f, source, [
    { caseId: f.smokeCase.id, status: "PASSED" },
    { caseId: f.otherCase.id, status: "PASSED" },
  ]);
  expect(cli(0)).toContain("gate: PASS");
});

test.afterAll(async () => {
  const project = await db.project.findUnique({
    where: { slug: E2E.projectSlug },
    select: { id: true },
  });
  if (project) await setPolicy(project.id, null); // later specs see no gate
  await db.$disconnect();
});
