"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { DEFAULT_STATUS_DEFS, STATUS_KINDS } from "@/lib/result-statuses";

// F-14: manage a project's result-status definitions. A project runs on the
// in-memory defaults until its first edit here, which seeds the 7 system rows
// (key & kind immutable, label/color editable, never deactivatable) before
// applying the change. All actions are keyed by (projectId, key) — not row id —
// so editing a default that has no row yet works transparently.

type ActionResult = { error?: string; ok?: boolean };

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

async function requireStatusAdmin(
  projectId: string
): Promise<{ userId: string; slug: string } | { error: string }> {
  const session = await requireSession();
  if (!(await can(session.userId, projectId, "fields.manage")))
    return { error: "You don't have permission to manage statuses." };
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  if (!project) return { error: "Project not found." };
  return { userId: session.userId, slug: project.slug };
}

/** First edit for a project? Materialize the defaults as system rows. */
async function ensureSeeded(projectId: string): Promise<void> {
  const count = await db.resultStatusDef.count({ where: { projectId } });
  if (count > 0) return;
  await db.$transaction(
    DEFAULT_STATUS_DEFS.map((d) =>
      db.resultStatusDef.create({ data: { projectId, ...d } })
    )
  );
}

export async function createResultStatus(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId"));
  const admin = await requireStatusAdmin(projectId);
  if ("error" in admin) return admin;

  const label = String(formData.get("label") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  const kind = String(formData.get("kind") ?? "").toUpperCase();
  if (!label) return { error: "Status label is required." };
  if (label.length > 30) return { error: "Label is too long (max 30 chars)." };
  if (!HEX_RE.test(color)) return { error: "Pick a color." };
  if (!STATUS_KINDS.includes(kind as (typeof STATUS_KINDS)[number]))
    return { error: `Kind must be one of: ${STATUS_KINDS.join(", ")}.` };

  // Machine key from the label: "Known Issue" -> KNOWN_ISSUE. Immutable after
  // create (results store this key), so collisions are rejected, not merged.
  const key = label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
  if (!key) return { error: "Label must contain letters or digits." };

  await ensureSeeded(projectId);
  const dup = await db.resultStatusDef.findUnique({
    where: { projectId_key: { projectId, key } },
  });
  if (dup) return { error: `A status with key ${key} already exists.` };

  const last = await db.resultStatusDef.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await db.resultStatusDef.create({
    data: { projectId, key, label, color, kind, order: (last?.order ?? -1) + 1 },
  });

  await logAudit({
    userId: admin.userId,
    action: "status.create",
    entityType: "project",
    entityId: projectId,
    detail: `${label} (${key}, ${kind})`,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
  return { ok: true };
}

export async function updateResultStatus(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId"));
  const key = String(formData.get("key"));
  const admin = await requireStatusAdmin(projectId);
  if ("error" in admin) return admin;

  await ensureSeeded(projectId);
  const def = await db.resultStatusDef.findUnique({
    where: { projectId_key: { projectId, key } },
  });
  if (!def) return { error: "Status not found." };

  const label = String(formData.get("label") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  if (!label) return { error: "Status label is required." };
  if (label.length > 30) return { error: "Label is too long (max 30 chars)." };
  if (!HEX_RE.test(color)) return { error: "Pick a color." };

  // key is always immutable; kind is immutable on system rows (it drives the
  // core pass/fail semantics the app was built on).
  let kind = def.kind;
  if (!def.system && formData.get("kind") != null) {
    kind = String(formData.get("kind")).toUpperCase();
    if (!STATUS_KINDS.includes(kind as (typeof STATUS_KINDS)[number]))
      return { error: `Kind must be one of: ${STATUS_KINDS.join(", ")}.` };
  }

  await db.resultStatusDef.update({
    where: { id: def.id },
    data: { label, color, kind },
  });
  await logAudit({
    userId: admin.userId,
    action: "status.update",
    entityType: "project",
    entityId: projectId,
    detail: `${key}: ${label}, ${color}, ${kind}`,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
  return { ok: true };
}

export async function toggleResultStatus(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const key = String(formData.get("key"));
  const admin = await requireStatusAdmin(projectId);
  if ("error" in admin) return;

  await ensureSeeded(projectId);
  const def = await db.resultStatusDef.findUnique({
    where: { projectId_key: { projectId, key } },
  });
  if (!def || def.system) return; // system statuses can't be deactivated

  await db.resultStatusDef.update({
    where: { id: def.id },
    data: { active: !def.active },
  });
  await logAudit({
    userId: admin.userId,
    action: "status.toggle",
    entityType: "project",
    entityId: projectId,
    detail: `${key}: ${def.active ? "deactivated" : "activated"}`,
  });
  revalidatePath(`/projects/${admin.slug}/fields`);
}

/** Swap order with the neighbor above/below (drives shortcut precedence). */
export async function moveResultStatus(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId"));
  const key = String(formData.get("key"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const admin = await requireStatusAdmin(projectId);
  if ("error" in admin) return;

  await ensureSeeded(projectId);
  const def = await db.resultStatusDef.findUnique({
    where: { projectId_key: { projectId, key } },
  });
  if (!def) return;

  const neighbor = await db.resultStatusDef.findFirst({
    where: {
      projectId,
      order: dir === -1 ? { lt: def.order } : { gt: def.order },
    },
    orderBy: { order: dir === -1 ? "desc" : "asc" },
  });
  if (!neighbor) return;

  await db.$transaction([
    db.resultStatusDef.update({ where: { id: def.id }, data: { order: neighbor.order } }),
    db.resultStatusDef.update({ where: { id: neighbor.id }, data: { order: def.order } }),
  ]);
  revalidatePath(`/projects/${admin.slug}/fields`);
}
