"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { parseGatePolicy, type GatePolicy } from "@/lib/gate";

// L-02: save the project's CI quality-gate policy. Gated project.admin
// (the work order's OWNER/ADMIN, expressed through the F-14 permission
// system so custom roles keep working). Empty form ⇒ policy cleared.

export async function saveGatePolicy(formData: FormData): Promise<void> {
  const session = await requireSession();
  const projectId = String(formData.get("projectId"));
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  if (!project) return;
  if (!(await can(session.userId, projectId, "project.admin"))) return;

  const policy: GatePolicy = {};
  const minPassRate = String(formData.get("minPassRate") ?? "").trim();
  if (minPassRate) policy.minPassRate = Number(minPassRate);
  const maxNewFailures = String(formData.get("maxNewFailures") ?? "").trim();
  if (maxNewFailures) policy.maxNewFailures = Number(maxNewFailures);
  if (formData.get("blockOnUntested") === "on") policy.blockOnUntested = true;
  const tags = String(formData.get("requiredTags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (tags.length) policy.requiredTags = tags;

  const empty = Object.keys(policy).length === 0;
  if (!empty) {
    try {
      parseGatePolicy(JSON.stringify(policy));
    } catch {
      return; // invalid numbers etc. — silently ignored, form re-renders stored state
    }
  }

  await db.project.update({
    where: { id: projectId },
    data: { gatePolicyJson: empty ? null : JSON.stringify(policy) },
  });
  await logAudit({
    userId: session.userId,
    action: "project.gate_update",
    entityType: "project",
    entityId: projectId,
    detail: empty ? "cleared" : JSON.stringify(policy),
  });
  revalidatePath(`/projects/${project.slug}/fields`);
}
