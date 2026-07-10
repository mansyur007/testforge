import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";

const db = new PrismaClient();

export const E2E = {
  email: "e2e@testforge.local",
  password: "E2eDemo123",
  projectSlug: "e2e",
};

// Seed a deterministic fixture into the LOCAL dev.db before the suite runs:
// a verified ADMIN account, an "e2e" project whose cases (seq 1..4) map to the
// TC-E2E-<n> test names, and a fresh local API key written to e2e-results/.api-key
// so the upload script can POST results back to /api/v1/junit.
async function globalSetup() {
  const org = await db.organization.upsert({
    where: { slug: "e2e-org" },
    update: {},
    create: { name: "E2E Org", slug: "e2e-org" },
  });

  const passwordHash = await bcrypt.hash(E2E.password, 10);
  const user = await db.user.upsert({
    where: { email: E2E.email },
    // reset the password every run so a change-password test can't lock us out
    update: {
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
      organizationId: org.id,
    },
    create: {
      name: "E2E User",
      email: E2E.email,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
      organizationId: org.id,
    },
  });

  const existing = await db.project.findUnique({
    where: { slug: E2E.projectSlug },
  });
  if (!existing) {
    await db.project.create({
      data: {
        name: "E2E",
        slug: E2E.projectSlug,
        description: "Playwright E2E fixture",
        createdById: user.id,
        caseCounter: 4,
        members: { create: { userId: user.id, role: "OWNER" } },
        cases: {
          create: [
            { seq: 1, title: "Valid login redirects to dashboard", stepsJson: "[]", priority: "HIGH", type: "FUNCTIONAL", tags: "smoke,login" },
            { seq: 2, title: "Language switcher on login", stepsJson: "[]", priority: "LOW", type: "FUNCTIONAL", tags: "i18n" },
            { seq: 3, title: "Change password succeeds", stepsJson: "[]", priority: "MEDIUM", type: "FUNCTIONAL", tags: "account" },
            { seq: 4, title: "Dashboard renders in English", stepsJson: "[]", priority: "LOW", type: "FUNCTIONAL", tags: "i18n" },
          ],
        },
      },
    });
  }

  // F-03 crash recovery: a failed custom-fields spec can leave a REQUIRED
  // field active on the e2e project, which would break every later case
  // creation. Start each run clean by disabling leftovers.
  await db.customFieldDef.updateMany({
    where: { project: { slug: E2E.projectSlug } },
    data: { active: false },
  });

  // F-08 crash recovery: leftover channels point at dead local receiver ports
  // and would skew row-count assertions. Start clean.
  await db.notificationChannel.deleteMany({
    where: { project: { slug: E2E.projectSlug } },
  });

  // F-07: same reasoning — a leftover integration points at a dead mock port,
  // which would make every later "create issue" call hang until it times out.
  await db.issueLink.deleteMany({ where: { project: { slug: E2E.projectSlug } } });
  await db.integration.deleteMany({ where: { project: { slug: E2E.projectSlug } } });

  // F-09 tenant-isolation fixture: a project owned by a DIFFERENT user with a
  // distinctive case title. Global search as the e2e user must never surface it.
  const outsider = await db.user.upsert({
    where: { email: "outsider@testforge.local" },
    update: {},
    create: {
      name: "Outsider",
      email: "outsider@testforge.local",
      passwordHash,
      role: "MEMBER",
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
    },
  });
  const foreign = await db.project.findUnique({
    where: { slug: "private-e2e" },
  });
  if (!foreign) {
    await db.project.create({
      data: {
        name: "Private E2E",
        slug: "private-e2e",
        description: "Tenant-isolation fixture — e2e user is NOT a member",
        createdById: outsider.id,
        caseCounter: 1,
        members: { create: { userId: outsider.id, role: "OWNER" } },
        cases: {
          create: [
            {
              seq: 1,
              title: "XyzzySecretCase must stay invisible",
              stepsJson: "[]",
              priority: "LOW",
              type: "FUNCTIONAL",
              tags: "isolation",
            },
          ],
        },
      },
    });
  }

  // Mint a fresh local API key (same scheme as the app: tf_<hex>, sha256 hash).
  await db.apiKey.deleteMany({ where: { userId: user.id, name: "e2e-local" } });
  const raw = `tf_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(raw).digest("hex");
  await db.apiKey.create({
    data: { userId: user.id, name: "e2e-local", prefix: raw.slice(0, 11), keyHash },
  });
  fs.mkdirSync("e2e-results", { recursive: true });
  fs.writeFileSync("e2e-results/.api-key", raw);

  await db.$disconnect();
}

export default globalSetup;
