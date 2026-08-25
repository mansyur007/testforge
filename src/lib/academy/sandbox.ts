import "server-only";
import { db } from "@/lib/db";
import {
  SANDBOX_CASES,
  SANDBOX_PROJECT_NAME,
  SANDBOX_SUITES,
  SHOPMINI_REQUIREMENTS,
} from "@/content/academy/sandbox";

// A-04: provisioning for the Academy sandbox — one real project per learner,
// created lazily the first time they open a hands-on lesson.
//
// It is a real project on purpose (docs/QA-ACADEMY.md §6): the lesson "write a
// test case" has to open the same CaseForm the product uses, with the same
// permissions, or it teaches something the learner will have to unlearn. What
// makes it a sandbox is `Project.kind`, which keeps it out of the surfaces that
// list the learner's actual work.

export const SANDBOX_KIND = "ACADEMY_SANDBOX";

/** Spread into a Project `where` to exclude sandboxes from a listing. */
export const NOT_SANDBOX = { kind: { not: SANDBOX_KIND } } as const;

/**
 * The same exclusion one level out, for counting a user's *memberships* rather
 * than listing projects: `_count: { select: { memberships: MEMBERSHIP_NOT_SANDBOX } }`.
 *
 * A count of memberships is a count of projects by another name, so it owes the
 * reader the same answer the listings give — otherwise opening one hands-on
 * lesson makes an account read as having a project it does not have.
 */
export const MEMBERSHIP_NOT_SANDBOX = { where: { project: NOT_SANDBOX } } as const;

/**
 * Slug is derived from the user id rather than random so a learner who deletes
 * their sandbox and starts a hands-on lesson again lands on the same URL — any
 * link a lesson printed for them keeps working. The collision loop exists
 * because `slug` is unique across all projects and nothing stops someone
 * naming a normal project `academy-xxxxxxxx`.
 */
async function freeSlug(userId: string): Promise<string> {
  const base = `academy-${userId.slice(-8).toLowerCase().replace(/[^a-z0-9]/g, "0")}`;
  for (let i = 0; i < 20; i++) {
    const slug = i === 0 ? base : `${base}-${i}`;
    const taken = await db.project.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

/** Applies the ShopMini fixture to an (empty) sandbox project. */
export async function seedSandbox(projectId: string): Promise<void> {
  const suites = new Map<string, string>();
  for (let order = 0; order < SANDBOX_SUITES.length; order++) {
    const name = SANDBOX_SUITES[order];
    const suite = await db.testSuite.create({
      data: { projectId, name, order },
    });
    suites.set(name, suite.id);
  }

  let seq = 0;
  for (const c of SANDBOX_CASES) {
    seq++;
    await db.testCase.create({
      data: {
        projectId,
        suiteId: suites.get(c.suite) ?? null,
        seq,
        title: c.title,
        priority: c.priority,
        type: c.type,
        tags: c.tags,
        preconditions: c.preconditions,
        stepsJson: JSON.stringify(c.steps),
        expectedResult: c.expectedResult,
      },
    });
  }
  await db.project.update({
    where: { id: projectId },
    data: { caseCounter: seq },
  });
}

/** The learner's sandbox, or null. */
export async function findSandbox(userId: string) {
  return db.project.findFirst({
    where: { kind: SANDBOX_KIND, members: { some: { userId } } },
    select: { id: true, slug: true, name: true },
  });
}

/**
 * The sandbox, creating and seeding it on first use. Role is OWNER so the
 * lessons can exercise every permission the product has — a learner who cannot
 * reach Settings cannot be taught what is behind it.
 */
export async function ensureSandbox(userId: string) {
  const existing = await findSandbox(userId);
  if (existing) return existing;

  const project = await db.project.create({
    data: {
      name: SANDBOX_PROJECT_NAME,
      slug: await freeSlug(userId),
      description: SHOPMINI_REQUIREMENTS,
      kind: SANDBOX_KIND,
      createdById: userId,
      members: { create: { userId, role: "OWNER" } },
    },
    select: { id: true, slug: true, name: true },
  });
  await seedSandbox(project.id);
  return project;
}

/**
 * Wipe and re-seed. Cases and suites cascade from the project, but the sandbox
 * itself is kept — deleting and recreating would change the slug for anyone
 * whose sandbox predates the collision loop above, and the point of Reset is
 * "give me the starting position back", not "give me a different project".
 */
export async function resetSandbox(userId: string) {
  const sandbox = await findSandbox(userId);
  if (!sandbox) return ensureSandbox(userId);

  // Order matters: results reference cases, cases reference suites.
  await db.testRunResult.deleteMany({
    where: { run: { projectId: sandbox.id } },
  });
  await db.testRun.deleteMany({ where: { projectId: sandbox.id } });
  await db.testCase.deleteMany({ where: { projectId: sandbox.id } });
  await db.testSuite.deleteMany({ where: { projectId: sandbox.id } });
  await db.project.update({
    where: { id: sandbox.id },
    data: { caseCounter: 0, description: SHOPMINI_REQUIREMENTS },
  });
  await seedSandbox(sandbox.id);
  return sandbox;
}
