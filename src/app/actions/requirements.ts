"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { nextRefId } from "@/lib/requirements";

// F-18: requirements are authored like cases — gated on `case.write`.

async function requireReqEditor(
  projectId: string
): Promise<{ userId: string; slug: string } | null> {
  const session = await requireSession();
  if (!(await can(session.userId, projectId, "case.write"))) return null;
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

export async function createRequirement(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const editor = await requireReqEditor(projectId);
  if (!editor) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const refId =
    String(formData.get("refId") ?? "").trim() || (await nextRefId(projectId));

  // Skip silently on a duplicate refId (compound-unique) — keep the form idempotent.
  const dup = await db.requirement.findUnique({
    where: { projectId_refId: { projectId, refId } },
  });
  if (dup) return;

  const req = await db.requirement.create({
    data: {
      projectId,
      refId,
      title,
      descriptionMd: String(formData.get("descriptionMd") ?? "").trim() || null,
      sourceUrl: String(formData.get("sourceUrl") ?? "").trim() || null,
      createdById: editor.userId,
    },
  });
  await logAudit({
    userId: editor.userId,
    action: "requirement.create",
    entityType: "requirement",
    entityId: req.id,
    detail: `${refId} ${title}`,
  });
  revalidatePath(`/projects/${editor.slug}/requirements`);
}

export async function deleteRequirement(formData: FormData): Promise<void> {
  const id = String(formData.get("requirementId"));
  const req = await db.requirement.findUnique({ where: { id } });
  if (!req) return;
  const editor = await requireReqEditor(req.projectId);
  if (!editor) return;
  await db.requirement.delete({ where: { id } });
  await logAudit({
    userId: editor.userId,
    action: "requirement.delete",
    entityType: "requirement",
    entityId: id,
    detail: req.refId,
  });
  revalidatePath(`/projects/${editor.slug}/requirements`);
}

export async function toggleRequirementObsolete(formData: FormData): Promise<void> {
  const id = String(formData.get("requirementId"));
  const req = await db.requirement.findUnique({ where: { id } });
  if (!req) return;
  const editor = await requireReqEditor(req.projectId);
  if (!editor) return;
  await db.requirement.update({
    where: { id },
    data: { status: req.status === "OBSOLETE" ? "OPEN" : "OBSOLETE" },
  });
  revalidatePath(`/projects/${editor.slug}/requirements/${id}`);
  revalidatePath(`/projects/${editor.slug}/requirements`);
}

async function linkPaths(slug: string, requirementId: string, caseId: string) {
  revalidatePath(`/projects/${slug}/requirements/${requirementId}`);
  revalidatePath(`/projects/${slug}/requirements`);
  revalidatePath(`/projects/${slug}/cases/${caseId}`);
}

export async function linkCaseToRequirement(formData: FormData): Promise<void> {
  const requirementId = String(formData.get("requirementId"));
  const caseId = String(formData.get("caseId"));
  const req = await db.requirement.findUnique({ where: { id: requirementId } });
  if (!req) return;
  const editor = await requireReqEditor(req.projectId);
  if (!editor) return;
  // Case must belong to the same project.
  const tc = await db.testCase.findFirst({
    where: { id: caseId, projectId: req.projectId },
    select: { id: true },
  });
  if (!tc) return;
  await db.requirementCase.upsert({
    where: { requirementId_caseId: { requirementId, caseId } },
    create: { requirementId, caseId },
    update: {},
  });
  await linkPaths(editor.slug, requirementId, caseId);
}

export async function unlinkCaseFromRequirement(
  formData: FormData
): Promise<void> {
  const requirementId = String(formData.get("requirementId"));
  const caseId = String(formData.get("caseId"));
  const req = await db.requirement.findUnique({ where: { id: requirementId } });
  if (!req) return;
  const editor = await requireReqEditor(req.projectId);
  if (!editor) return;
  await db.requirementCase
    .delete({ where: { requirementId_caseId: { requirementId, caseId } } })
    .catch(() => {});
  await linkPaths(editor.slug, requirementId, caseId);
}

// CSV import: header row with columns refId,title,description,sourceUrl (order
// free, case-insensitive). Rows with an existing/blank refId are skipped;
// blank refId auto-numbers. Returns nothing (UI re-reads the list).
export async function importRequirementsCsv(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const editor = await requireReqEditor(projectId);
  if (!editor) return;
  const csv = String(formData.get("csv") ?? "");
  const rows = parseCsv(csv);
  if (rows.length === 0) return;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const iRef = col("refid");
  const iTitle = col("title");
  const iDesc = col("description");
  const iUrl = col("sourceurl");
  if (iTitle === -1) return; // title is required

  let created = 0;
  for (const row of rows.slice(1)) {
    const title = (row[iTitle] ?? "").trim();
    if (!title) continue;
    const refId =
      (iRef >= 0 ? row[iRef] : "").trim() || (await nextRefId(projectId));
    const exists = await db.requirement.findUnique({
      where: { projectId_refId: { projectId, refId } },
    });
    if (exists) continue;
    await db.requirement.create({
      data: {
        projectId,
        refId,
        title,
        descriptionMd: (iDesc >= 0 ? row[iDesc] : "").trim() || null,
        sourceUrl: (iUrl >= 0 ? row[iUrl] : "").trim() || null,
        createdById: editor.userId,
      },
    });
    created++;
  }
  await logAudit({
    userId: editor.userId,
    action: "requirement.import",
    entityType: "project",
    entityId: projectId,
    detail: `${created} imported`,
  });
  revalidatePath(`/projects/${editor.slug}/requirements`);
}

// Minimal RFC-4180-ish CSV parser (quotes, escaped "", commas, CRLF).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim() !== "")) rows.push(row);
  }
  return rows;
}
