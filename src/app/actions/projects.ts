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
  if (session.role === "VIEWER") return { error: "Viewer tidak bisa membuat proyek." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase() || slugify(name);

  if (!name || !slug) return { error: "Nama proyek wajib diisi." };
  if (!/^[a-z0-9-]+$/.test(slug))
    return { error: "Slug hanya boleh huruf kecil, angka, dan strip." };

  const existing = await db.project.findUnique({ where: { slug } });
  if (existing) return { error: `Slug "${slug}" sudah dipakai proyek lain.` };

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

export async function createSuite(formData: FormData) {
  const session = await requireSession();
  const projectId = String(formData.get("projectId"));
  if (!(await isProjectMember(session.userId, projectId))) notFound();
  const parentId = String(formData.get("parentId") ?? "") || null;
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

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
