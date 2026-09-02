import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();

export const E2E = {
  email: "e2e@testforge.local",
  password: "E2eDemo123",
  projectSlug: "e2e",
  // F-24: a second project the e2e user owns, used as the "Copy to project…" target.
  targetProjectSlug: "e2e-target",
  // F-16: a VIEWER member of the e2e project — a target for @mentions and proof
  // that a VIEWER may still comment.
  teammateEmail: "teammate@testforge.local",
  teammatePassword: "E2eDemo123",
  teammateName: "E2E Teammate",
  // F-15: a MEMBER (write access) of the e2e project — a valid case reviewer.
  reviewerEmail: "reviewer@testforge.local",
  reviewerPassword: "E2eDemo123",
  reviewerName: "E2E Reviewer",
  // F-20: a dedicated account for the 2FA flow so enabling/disabling TOTP never
  // interferes with the shared admin the rest of the suite logs in as.
  twoFactorEmail: "twofa@testforge.local",
  twoFactorPassword: "E2eDemo123",
  twoFactorName: "E2E TwoFactor",
  // The local API key the API-driving specs authenticate with. FIXED, not
  // random, and that is the whole point: the key is one row in a dev.db shared
  // by everything on this machine, and globalSetup used to `deleteMany` +
  // `create` it, publishing the fresh token to a *cwd-relative*
  // `e2e-results/.api-key`. So a second `playwright test` against that same
  // database revoked the token the first run was still using, without touching
  // the file the first run reads — and `verifyApiKey()` looks tokens up by
  // sha256 hash, so every later request 401'd. Two runs is not exotic here:
  // concurrent agent sessions share this tree, and a run launched from a git
  // worktree resolves `file:./dev.db` back to the main checkout's database
  // (the junctioned node_modules carries the generated client's schema path)
  // while process.cwd() — and therefore the file — stays in the worktree.
  //
  // A constant token upserted by its hash makes concurrent runs converge on
  // the same row instead of racing to invalidate each other, and leaves the
  // file unable to go stale. It never leaves a local dev.db, and it has the
  // same standing as the fixture passwords above.
  apiKey: "tf_56936734eb2c7a96814b2c9905af3fb40a85e9970ea356c3",
};

// The four rows the TC-E2E-1..4 smoke tests are named after, and the ones the
// rest of the suite looks up by title. Array position is the seq, so reordering
// this list renumbers them.
const FIXTURE_CASES = [
  { title: "Valid login redirects to dashboard", stepsJson: "[]", priority: "HIGH", type: "FUNCTIONAL", tags: "smoke,login" },
  { title: "Language switcher on login", stepsJson: "[]", priority: "LOW", type: "FUNCTIONAL", tags: "i18n" },
  { title: "Change password succeeds", stepsJson: "[]", priority: "MEDIUM", type: "FUNCTIONAL", tags: "account" },
  { title: "Dashboard renders in English", stepsJson: "[]", priority: "LOW", type: "FUNCTIONAL", tags: "i18n" },
];

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

  const eProject = await db.project.upsert({
    where: { slug: E2E.projectSlug },
    update: {},
    create: {
      name: "E2E",
      slug: E2E.projectSlug,
      description: "Playwright E2E fixture",
      createdById: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
    select: { id: true },
  });

  // The case list is shared state the whole suite reads, and it used to be
  // seeded once and never cleaned: the project was created with seq 1..4 on the
  // first run and left alone on every run after, while the specs that create
  // cases piled theirs on top. After enough runs the fixture titles existed
  // four times over and the list paginated past row one, which is exactly the
  // two things bulk-copy-reorder asserts on — TC-E2E-26 counted 5 rows titled
  // "Valid login redirects to dashboard" where it wanted 2, and TC-E2E-25's
  // drag target had fallen off the page. Every title lookup elsewhere
  // (mute-flaky, run-comparison, share-links, search, saved-views) was reading
  // an arbitrary one of the duplicates too.
  //
  // So hard-reset the case tree each run and re-seed the fixture, the way
  // resetSandbox does for the Academy sandbox (src/lib/academy/sandbox.ts).
  // Order matters: results reference cases, cases reference suites. Runs go
  // with them — a run whose results were all just deleted is noise no spec
  // wants, and no spec reads a run it didn't create itself.
  await db.testRunResult.deleteMany({ where: { run: { projectId: eProject.id } } });
  await db.testRun.deleteMany({ where: { projectId: eProject.id } });
  await db.testCase.deleteMany({ where: { projectId: eProject.id } });
  await db.testSuite.deleteMany({ where: { projectId: eProject.id } });
  await db.project.update({
    where: { id: eProject.id },
    data: { caseCounter: FIXTURE_CASES.length },
  });
  await db.testCase.createMany({
    data: FIXTURE_CASES.map((c, i) => ({ ...c, projectId: eProject.id, seq: i + 1 })),
  });

  // F-24: empty project the e2e user owns, used as the "Copy to project…"
  // target so the copy e2e spec doesn't need a third account.
  const existingTarget = await db.project.findUnique({
    where: { slug: E2E.targetProjectSlug },
  });
  if (!existingTarget) {
    await db.project.create({
      data: {
        name: "E2E Target",
        slug: E2E.targetProjectSlug,
        description: "Playwright E2E fixture — copy-to-project destination",
        createdById: user.id,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });
  } else {
    // F-24 crash recovery: a failed copy spec can leave cases from a previous
    // run sitting here and skew "copied N cases" assertions. Start clean.
    await db.testCase.deleteMany({ where: { project: { slug: E2E.targetProjectSlug } } });
  }

  // L-01: a previous run leaves an active/revoked badge token behind; the
  // badge spec starts from the "Enable badge" state, so wipe it.
  await db.badgeToken.deleteMany({
    where: { project: { slug: E2E.projectSlug } },
  });

  // F-16: a VIEWER teammate on the e2e project — @mention target + proof a
  // VIEWER can comment. Idempotent membership so reruns don't duplicate.
  const teammate = await db.user.upsert({
    where: { email: E2E.teammateEmail },
    update: { passwordHash, emailVerifiedAt: new Date(), onboardedAt: new Date() },
    create: {
      name: E2E.teammateName,
      email: E2E.teammateEmail,
      passwordHash,
      role: "MEMBER",
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
      organizationId: org.id,
    },
  });
  await db.projectMember.upsert({
    where: { projectId_userId: { projectId: eProject.id, userId: teammate.id } },
    update: { role: "VIEWER" },
    create: { projectId: eProject.id, userId: teammate.id, role: "VIEWER" },
  });
  // F-15: a MEMBER-role reviewer (write access) on the e2e project.
  const reviewer = await db.user.upsert({
    where: { email: E2E.reviewerEmail },
    update: { passwordHash, emailVerifiedAt: new Date(), onboardedAt: new Date() },
    create: {
      name: E2E.reviewerName,
      email: E2E.reviewerEmail,
      passwordHash,
      role: "MEMBER",
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
      organizationId: org.id,
    },
  });
  await db.projectMember.upsert({
    where: { projectId_userId: { projectId: eProject.id, userId: reviewer.id } },
    update: { role: "MEMBER" },
    create: { projectId: eProject.id, userId: reviewer.id, role: "MEMBER" },
  });
  // F-20: dedicated 2FA account, reset to a clean (no-TOTP) state every run so a
  // prior run's enrollment can't leave it stuck at the second login step.
  const twoFactor = await db.user.upsert({
    where: { email: E2E.twoFactorEmail },
    update: {
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
      totpSecretEnc: null,
      totpEnabledAt: null,
    },
    create: {
      name: E2E.twoFactorName,
      email: E2E.twoFactorEmail,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
      onboardedAt: new Date(),
      organizationId: org.id,
    },
  });
  await db.twoFactorRecoveryCode.deleteMany({ where: { userId: twoFactor.id } });

  // Start each run with a clean comment thread so counts don't drift.
  await db.comment.deleteMany({ where: { projectId: eProject.id } });
  // F-14 crash recovery: leftover custom statuses/roles from a previous run
  // would make "create Known Issue / Executor" fail on the unique constraint.
  await db.resultStatusDef.deleteMany({ where: { projectId: eProject.id } });
  await db.roleDef.deleteMany({ where: { name: { startsWith: "Executor " } } });

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

  // F-06: config groups are unique per (project, name) and plans pile up across
  // runs of the suite — start clean. Runs referencing a plan must go first (the
  // FK has no cascade); the case-tree reset above has already removed them all.
  await db.testPlan.deleteMany({ where: { project: { slug: E2E.projectSlug } } });
  await db.configGroup.deleteMany({
    where: { project: { slug: E2E.projectSlug } },
  });

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

  // Settle the local API key (same scheme as the app: tf_<hex>, sha256 hash).
  // Upsert on the hash rather than delete-then-create — see E2E.apiKey for why
  // re-minting a random token every run was the bug. The update clause resets
  // the fields the key could have drifted on (scope/project/rate limit), in the
  // same crash-recovery spirit as the fixtures above.
  const keyHash = crypto.createHash("sha256").update(E2E.apiKey).digest("hex");
  await db.apiKey.upsert({
    where: { keyHash },
    update: {
      userId: user.id,
      name: "e2e-local",
      scope: "WRITE",
      projectId: null,
      rateLimitPerMin: null,
    },
    create: {
      userId: user.id,
      name: "e2e-local",
      prefix: E2E.apiKey.slice(0, 11),
      keyHash,
    },
  });
  // Sweep the random keys older runs left behind, after the fixed one exists so
  // there is never a moment with no "e2e-local" key for a parallel run to hit.
  await db.apiKey.deleteMany({
    where: { userId: user.id, name: "e2e-local", keyHash: { not: keyHash } },
  });
  // Resolved from this file, not process.cwd(): the specs read the key straight
  // off E2E.apiKey now, but scripts/upload-junit.mjs still reads this file, and
  // it should land in the checkout that owns it however playwright was invoked.
  const outDir = path.join(__dirname, "..", "e2e-results");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, ".api-key"), E2E.apiKey);

  await db.$disconnect();
}

export default globalSetup;
