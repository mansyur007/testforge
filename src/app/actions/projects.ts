"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 20);
}

export async function createProject(
  _prev: { error?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  if (session.role === "VIEWER") return { error: "Viewers cannot create projects." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase() || slugify(name);

  if (!name || !slug) return { error: "Project name is required." };
  if (!/^[a-z0-9-]+$/.test(slug))
    return { error: "Slug may only contain lowercase letters, numbers, and dashes." };

  const existing = await db.project.findUnique({ where: { slug } });
  if (existing) return { error: `Slug "${slug}" is already taken by another project.` };

  const project = await db.project.create({
    data: {
      name,
      slug,
      description: description || null,
      createdById: session.userId,
      members: {
        create: { userId: session.userId, role: "OWNER" },
      },
    },
  });

  await logAudit({
    userId: session.userId,
    action: "project.create",
    entityType: "project",
    entityId: project.id,
    detail: name,
  });
  redirect(`/projects/${project.slug}`);
}

export async function archiveProject(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("projectId"));
  if (!(await isProjectMember(session.userId, id))) notFound();
  const project = await db.project.findUniqueOrThrow({ where: { id } });
  const next = project.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
  await db.project.update({ where: { id }, data: { status: next } });
  await logAudit({
    userId: session.userId,
    action: next === "ARCHIVED" ? "project.archive" : "project.unarchive",
    entityType: "project",
    entityId: id,
  });
  revalidatePath("/projects");
}

// useFormState signature: (prevState, formData). Returns {ok} so the client
// form can reset its inputs after a successful create.
export async function createSuite(
  _prev: { ok?: boolean } | undefined,
  formData: FormData
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const projectId = String(formData.get("projectId"));
  if (!(await isProjectMember(session.userId, projectId))) notFound();
  const parentId = String(formData.get("parentId") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false };

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  const count = await db.testSuite.count({ where: { projectId } });
  await db.testSuite.create({
    data: { projectId, parentId, name, order: count },
  });
  await logAudit({
    userId: session.userId,
    action: "suite.create",
    entityType: "suite",
    detail: name,
  });
  revalidatePath(`/projects/${project.slug}`);
  return { ok: true };
}

// Delete a suite and all of its sub-suites — but only when the whole subtree is
// empty of (non-deleted) test cases. If any case is still attached, the user is
// asked to move or delete those cases first, so nothing is silently orphaned.
export async function deleteSuite(
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const session = await requireSession();
  const suiteId = String(formData.get("suiteId"));

  const suite = await db.testSuite.findFirst({
    where: {
      id: suiteId,
      project: { members: { some: { userId: session.userId } } },
    },
    include: { project: { select: { slug: true } } },
  });
  if (!suite) return { error: "Suite not found." };

  // Collect the suite + every descendant (sub-suites are 1 level deep today, but
  // walk the tree so this stays correct if nesting grows).
  const all = await db.testSuite.findMany({
    where: { projectId: suite.projectId },
    select: { id: true, parentId: true },
  });
  const ids = [suiteId];
  for (let i = 0; i < ids.length; i++) {
    for (const s of all) if (s.parentId === ids[i]) ids.push(s.id);
  }

  const caseCount = await db.testCase.count({
    where: { suiteId: { in: ids }, deletedAt: null },
  });
  if (caseCount > 0) {
    return {
      error: `This suite still has ${caseCount} test case${caseCount === 1 ? "" : "s"} (here or in a sub-suite). Move them to another suite or delete them first.`,
    };
  }

  // Delete deepest-first so a parent is never removed while a child still
  // references it.
  for (const id of ids.reverse()) {
    await db.testSuite.delete({ where: { id } });
  }
  await logAudit({
    userId: session.userId,
    action: "suite.delete",
    entityType: "suite",
    entityId: suiteId,
    detail: `${suite.name} (+${ids.length - 1} sub-suite${ids.length - 1 === 1 ? "" : "s"})`,
  });
  revalidatePath(`/projects/${suite.project.slug}`);
  return { ok: true };
}

export async function createMilestone(formData: FormData) {
  const session = await requireSession();
  const projectId = String(formData.get("projectId"));
  if (!(await isProjectMember(session.userId, projectId))) notFound();
  const name = String(formData.get("name") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  if (!name) return;

  const project = await db.project.findUniqueOrThrow({ where: { id: projectId } });
  await db.milestone.create({
    data: {
      projectId,
      name,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });
  await logAudit({ userId: session.userId, action: "milestone.create", detail: name });
  revalidatePath(`/projects/${project.slug}/runs`);
}
