import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import AdmZip from "adm-zip";
import { PrismaClient } from "@prisma/client";
import { E2E } from "./global-setup";

// L-05 Backup & restore: the round trip that matters is instance A → instance B,
// so this spec never touches the dev database it is backing up. "Instance B" is
// a second sqlite file (prisma/e2e-restore.db) with its own uploads directory —
// created, restored into, and asserted against here. Wiping the shared dev.db
// mid-suite would destroy the fixtures every other spec depends on.
const TC = (process.env.TF_PROJECT ?? "e2e").toUpperCase();

// Prisma resolves a relative sqlite url against prisma/, the same as dev.db.
const B_URL = "file:./e2e-restore.db";
const B_FILE = "prisma/e2e-restore.db";
const B_UPLOADS = "e2e-results/restore-uploads";
const ARCHIVE = "e2e-results/instance-a.tfbackup";

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

async function login(page: Page) {
  await page.goto("/login");
  await page.fill('input[name="email"]', E2E.email);
  await page.fill('input[name="password"]', E2E.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}

/** A clean instance B: empty schema, no uploads. Never uses --force-reset. */
function freshInstanceB() {
  fs.rmSync(B_FILE, { force: true });
  fs.rmSync(`${B_FILE}-journal`, { force: true });
  fs.rmSync(B_UPLOADS, { recursive: true, force: true });
  // Run the Prisma CLI's entry point under `node` rather than via `npx`, the
  // same way the other specs invoke tooling. `execFileSync` without a shell
  // cannot resolve `npx` on Windows (PATH only carries the extensionless bash
  // script and npx.cmd, neither of which a non-shell spawn will execute), so
  // this line used to ENOENT there; going direct also survives a missing
  // node_modules/.bin.
  execFileSync(
    "node",
    [
      path.join("node_modules", "prisma", "build", "index.js"),
      "db",
      "push",
      "--skip-generate",
      "--accept-data-loss",
    ],
    {
      env: { ...process.env, DATABASE_URL: B_URL },
      stdio: "pipe",
    }
  );
}

type RunResult = { status: number; stdout: string; stderr: string };

function runRestore(args: string[], extraEnv: Record<string, string> = {}): RunResult {
  try {
    const stdout = execFileSync("node", ["scripts/restore.mjs", ...args], {
      env: { ...process.env, DATABASE_URL: B_URL, TF_UPLOAD_DIR: B_UPLOADS, ...extraEnv },
      encoding: "utf8",
      stdio: "pipe",
    });
    return { status: 0, stdout, stderr: "" };
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string };
    return { status: err.status, stdout: err.stdout ?? "", stderr: err.stderr ?? "" };
  }
}

function clientB() {
  return new PrismaClient({ datasources: { db: { url: B_URL } } });
}

/**
 * global-setup clears the fixture project's integrations, so the archive would
 * otherwise carry none and the TF_SECRET assertions below would pass without
 * testing anything. Plant one — on the copy-target project, so it cannot collide
 * with integrations.spec's own (unique per project+provider) — and remove it as
 * soon as the backup is taken, leaving dev.db as we found it.
 */
async function plantIntegration(a: PrismaClient) {
  // Encrypt in a `node` subprocess rather than importing the .mjs here: the
  // Playwright transform chokes on ESM pulled into a spec (same reason the OIDC
  // spec defers jose), and a plain-node call is exactly how restore.mjs will
  // load this module anyway.
  const encrypt = (plaintext: string) =>
    execFileSync(
      "node",
      [
        "-e",
        'import("./src/lib/crypto-core.mjs").then(m => process.stdout.write(m.encrypt(process.argv[1])))',
        plaintext,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    ).trim();

  const project = await a.project.findUniqueOrThrow({
    where: { slug: E2E.targetProjectSlug },
    select: { id: true },
  });
  await a.integration.deleteMany({ where: { projectId: project.id, provider: "JIRA" } });
  await a.integration.create({
    data: {
      projectId: project.id,
      provider: "JIRA",
      baseUrl: "https://example.invalid",
      targetKey: "QA",
      authEnc: encrypt(JSON.stringify({ email: "qa@example.invalid", apiToken: "s3cret" })),
      active: true,
    },
  });
  return project.id;
}

/**
 * What the archive declares it holds. Asserting instance B against the manifest
 * (rather than against instance A) keeps the check stable even though the suite
 * keeps writing to the dev database after the backup is taken.
 */
function manifestOf(file: string) {
  const zip = new AdmZip(fs.readFileSync(file));
  return JSON.parse(zip.readFile(zip.getEntry("manifest.json")!)!.toString("utf8")) as {
    formatVersion: number;
    rowCounts: Record<string, number>;
    uploadsBytes: number;
  };
}

test.describe.serial("L-05 backup & restore", () => {
  test(`TC-${TC}-59 Backup downloads and restores onto a clean instance intact`, async ({
    page,
  }) => {
    await login(page);

    // An attachment guarantees the archive carries at least one real file, so
    // the byte-identity assertion below is never vacuous.
    const list = await page.request.get(
      `/api/v1/projects/${E2E.projectSlug}/cases?limit=1`
    );
    const caseId = (await list.json()).data[0].id as string;
    const filename = `backup-evidence-${Date.now()}.png`;
    await page.goto(`/projects/${E2E.projectSlug}/cases/${caseId}`);
    await page.setInputFiles('[data-testid="attachment-input"]', {
      name: filename,
      mimeType: "image/png",
      buffer: PNG_1PX,
    });
    // An image attachment renders as a thumbnail, so the filename only appears
    // on its delete control (hidden until hover — a count assertion is enough).
    await expect(page.getByLabel(`Delete ${filename}`)).toHaveCount(1);

    // 1. Download the backup from instance A.
    const a = new PrismaClient();
    let projectId: string;
    let badgeTokensA: string[];
    try {
      projectId = await plantIntegration(a);
      // Snapshot what instance A's badges actually are, so the restore can be
      // checked against them below rather than against a shape the tokens only
      // happen to have on a freshly pushed schema.
      badgeTokensA = (await a.badgeToken.findMany({ select: { token: true } }))
        .map((t) => t.token)
        .sort();
      const res = await page.request.get("/api/admin/backup");
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toBe("application/zip");
      expect(res.headers()["content-disposition"]).toMatch(/\.tfbackup"$/);
      fs.mkdirSync("e2e-results", { recursive: true });
      fs.writeFileSync(ARCHIVE, await res.body());
    } finally {
      // Leave dev.db exactly as we found it: the archive already holds both of
      // these, and attachments.spec asserts an exact attachment count on this
      // very case, so a leftover row here would break it on the next run. Only
      // the rows go — the stored file is deduped by sha256 (F-01) and is very
      // likely the same object another attachment points at.
      await a.attachment.deleteMany({ where: { filename } });
      await a.integration.deleteMany({
        where: { provider: "JIRA", baseUrl: "https://example.invalid" },
      });
      await a.$disconnect();
    }

    const manifest = manifestOf(ARCHIVE);
    expect(manifest.formatVersion).toBe(1);
    expect(manifest.uploadsBytes).toBeGreaterThan(0);
    // Guards the TF_SECRET tests below against passing vacuously.
    expect(manifest.rowCounts.Integration).toBeGreaterThan(0);

    // 2. Restore into a clean instance B.
    freshInstanceB();
    const out = runRestore([ARCHIVE]);
    expect(out.stderr + out.stdout).toContain("Restored");
    expect(out.status).toBe(0);

    // 3. Every model matches the row count the archive declared.
    const b = clientB();
    try {
      for (const [model, expected] of Object.entries(manifest.rowCounts)) {
        const key = model[0].toLowerCase() + model.slice(1);
        const count = await (b as unknown as Record<string, { count(): Promise<number> }>)[
          key
        ].count();
        expect.soft(count, `${model} row count`).toBe(expected);
      }

      // Users can log in: the password hash carried over unchanged.
      const user = await b.user.findUniqueOrThrow({ where: { email: E2E.email } });
      expect(await bcrypt.compare(E2E.password, user.passwordHash)).toBe(true);

      // Attachments are byte-identical, and the row's sha256 still describes the
      // file sitting on instance B's disk.
      const att = await b.attachment.findFirstOrThrow({ where: { filename } });
      const restored = fs.readFileSync(path.join(B_UPLOADS, att.storageKey));
      expect(crypto.createHash("sha256").update(restored).digest("hex")).toBe(att.sha256);
      expect(restored.equals(PNG_1PX)).toBe(true);

      // Badge tokens (L-01) carry their token string — that string IS what makes
      // /badge/<token>.svg serve, so an intact row is an intact badge. Compare
      // against instance A's own tokens: asserting a 64-char length instead only
      // held on a database nothing had seeded, and prisma/seed.mjs plants a
      // literal "demo-badge-token" (16 chars), so every local dev.db failed here.
      const badgeTokensB = (await b.badgeToken.findMany({ select: { token: true } }))
        .map((t) => t.token)
        .sort();
      expect(badgeTokensB).toEqual(badgeTokensA);

      // Same TF_SECRET on both instances ⇒ integrations stay live, with their
      // encrypted credentials carried across untouched (the contrast to TC-61).
      const integration = await b.integration.findFirstOrThrow({
        where: { baseUrl: "https://example.invalid" },
      });
      expect(integration.active).toBe(true);
      expect(integration.authEnc.startsWith("v1:")).toBe(true);
    } finally {
      await b.$disconnect();
    }
  });

  test(`TC-${TC}-60 Restore refuses a populated instance; --force-wipe replaces it`, async () => {
    // Instance B is populated by the previous test.
    const refused = runRestore([ARCHIVE]);
    expect(refused.status).toBe(1);
    expect(refused.stderr).toContain("already has data");

    // Non-interactive --force-wipe without --yes must not erase anything either.
    const noConsent = runRestore([ARCHIVE, "--force-wipe"]);
    expect(noConsent.status).toBe(1);
    expect(noConsent.stderr).toContain("--yes");

    const b = clientB();
    try {
      expect(await b.project.count()).toBeGreaterThan(0); // still there

      const wiped = runRestore([ARCHIVE, "--force-wipe", "--yes"]);
      expect(wiped.status).toBe(0);
      expect(wiped.stdout).toContain("erased");

      // Wipe + import is one transaction, so B ends up equal to the archive —
      // not doubled, not empty.
      const manifest = manifestOf(ARCHIVE);
      expect(await b.testCase.count()).toBe(manifest.rowCounts.TestCase);
      expect(await b.user.count()).toBe(manifest.rowCounts.User);
    } finally {
      await b.$disconnect();
    }
  });

  test(`TC-${TC}-61 A different TF_SECRET deactivates integrations, loses nothing else`, async () => {
    freshInstanceB();
    const out = runRestore([ARCHIVE], { TF_SECRET: "a-different-instance-secret" });
    expect(out.status).toBe(0);

    const b = clientB();
    try {
      const manifest = manifestOf(ARCHIVE);
      expect(await b.integration.count()).toBe(manifest.rowCounts.Integration);
      expect(await b.integration.count({ where: { active: true } })).toBe(0);
      expect(out.stdout).toContain("INACTIVE");

      // Nothing else is lost — the secret only gates the integrations.
      expect(await b.testCase.count()).toBe(manifest.rowCounts.TestCase);
      expect(await b.testRun.count()).toBe(manifest.rowCounts.TestRun);
      expect(await b.attachment.count()).toBe(manifest.rowCounts.Attachment);
    } finally {
      await b.$disconnect();
    }
  });

  test(`TC-${TC}-62 A truncated archive is refused and changes nothing`, async () => {
    const b = clientB();
    try {
      const before = await b.testCase.count();
      expect(before).toBeGreaterThan(0);

      const truncated = "e2e-results/truncated.tfbackup";
      const full = fs.readFileSync(ARCHIVE);
      fs.writeFileSync(truncated, full.subarray(0, Math.floor(full.length * 0.6)));

      const out = runRestore([truncated, "--force-wipe", "--yes"]);
      expect(out.status).toBe(1);
      expect(out.stderr).toContain("Refused");
      expect(out.stderr).toContain("The database was not modified.");

      // Even with --force-wipe, a refusal happens before any write.
      expect(await b.testCase.count()).toBe(before);
    } finally {
      await b.$disconnect();
    }
  });

  test(`TC-${TC}-63 Settings offers a download and refuses restore on a live instance`, async ({
    page,
  }) => {
    await login(page);
    await page.goto("/settings/backup");

    await expect(page.getByTestId("backup-download")).toBeVisible();
    // The dev instance has projects, so the restore form must not be offered.
    await expect(page.getByTestId("restore-file")).toHaveCount(0);
    await expect(page.getByText(/only offered on a fresh instance/i)).toBeVisible();
    await expect(page.getByText(/--force-wipe/)).toBeVisible();
  });
});
