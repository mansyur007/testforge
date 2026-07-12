"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { recordRevision } from "@/lib/case-revisions";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { caseDisplayId } from "@/lib/constants";

// F-15: case review workflow. A writer sends a DRAFT/ACTIVE case for review and
// picks a reviewer (≠ themselves); the assigned reviewer approves (→ APPROVED)
// or requests changes (→ DRAFT + a required note). Every transition is a real
// status change, so F-05 history records the DRAFT→IN_REVIEW→APPROVED trail.

type ActionResult = { error?: string; ok?: boolean };

async function loadScopedCase(userId: string, caseId: string) {
  return db.testCase.findFirst({
    where: { id: caseId, project: { members: { some: { userId } } }, deletedAt: null },
    include: { project: { select: { id: true, slug: true } } },
  });
}

function caseUrl(slug: string, caseId: string) {
  return `${notifyBaseUrl()}/projects/${slug}/cases/${caseId}`;
}

/** Author (any writer) sends a case for review and assigns a reviewer. */
export async function requestReview(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  if (session.role === "VIEWER")
    return { error: "Viewers don't have write access." };

  const caseId = String(formData.get("caseId"));
  const reviewerId = String(formData.get("reviewerId") ?? "");
  const c = await loadScopedCase(session.userId, caseId);
  if (!c) return { error: "Case not found." };
  if (c.status === "IN_REVIEW")
    return { error: "This case is already in review." };
  if (!reviewerId) return { error: "Pick a reviewer." };
  if (reviewerId === session.userId)
    return { error: "You can't review your own case — pick someone else." };

  const reviewer = await db.projectMember.findFirst({
    where: { projectId: c.project.id, userId: reviewerId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!reviewer) return { error: "Reviewer must be a member of this project." };
  if (reviewer.role === "VIEWER")
    return { error: "A view-only member can't be assigned as a reviewer." };

  await db.testCase.update({
    where: { id: caseId },
    data: {
      status: "IN_REVIEW",
      reviewerId,
      reviewedAt: null,
      reviewNote: null,
    },
  });
  await recordRevision(caseId, session.userId, `requested review from ${reviewer.user.name}`);
  await logAudit({
    userId: session.userId,
    action: "case.review_requested",
    entityType: "case",
    entityId: caseId,
    detail: `reviewer ${reviewer.user.name}`,
  });

  const url = caseUrl(c.project.slug, caseId);
  await dispatchWebhook(c.project.id, "case.review_requested", {
    caseId,
    displayId: caseDisplayId(c.project.slug, c.seq),
    reviewerId,
    url,
  });
  await notify(c.project.id, "case.review_requested", {
    title: `Review requested: ${c.title}`,
    url,
    fields: [
      { label: "Reviewer", value: reviewer.user.name },
      { label: "Requested by", value: session.name },
    ],
  });

  revalidatePath(`/projects/${c.project.slug}/cases/${caseId}`);
  return { ok: true };
}

/** The assigned reviewer approves the case. */
export async function approveCase(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const caseId = String(formData.get("caseId"));
  const c = await loadScopedCase(session.userId, caseId);
  if (!c) return { error: "Case not found." };
  if (c.status !== "IN_REVIEW" || c.reviewerId !== session.userId)
    return { error: "Only the assigned reviewer can approve this case." };

  await db.testCase.update({
    where: { id: caseId },
    data: { status: "APPROVED", reviewedAt: new Date(), reviewNote: null },
  });
  await recordRevision(caseId, session.userId, "approved");
  await logAudit({
    userId: session.userId,
    action: "case.approved",
    entityType: "case",
    entityId: caseId,
    detail: c.title,
  });

  const url = caseUrl(c.project.slug, caseId);
  await dispatchWebhook(c.project.id, "case.approved", {
    caseId,
    displayId: caseDisplayId(c.project.slug, c.seq),
    url,
  });
  await notify(c.project.id, "case.approved", {
    title: `Case approved: ${c.title}`,
    url,
    tone: "good",
    fields: [{ label: "Approved by", value: session.name }],
  });

  revalidatePath(`/projects/${c.project.slug}/cases/${caseId}`);
  return { ok: true };
}

/** The assigned reviewer sends the case back to DRAFT with a required note. */
export async function requestChanges(formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const caseId = String(formData.get("caseId"));
  const note = String(formData.get("note") ?? "").trim();
  const c = await loadScopedCase(session.userId, caseId);
  if (!c) return { error: "Case not found." };
  if (c.status !== "IN_REVIEW" || c.reviewerId !== session.userId)
    return { error: "Only the assigned reviewer can request changes." };
  if (!note) return { error: "A note is required when requesting changes." };

  await db.testCase.update({
    where: { id: caseId },
    data: { status: "DRAFT", reviewedAt: new Date(), reviewNote: note },
  });
  await recordRevision(caseId, session.userId, "requested changes");
  await logAudit({
    userId: session.userId,
    action: "case.changes_requested",
    entityType: "case",
    entityId: caseId,
    detail: note.slice(0, 140),
  });

  const url = caseUrl(c.project.slug, caseId);
  await dispatchWebhook(c.project.id, "case.changes_requested", {
    caseId,
    displayId: caseDisplayId(c.project.slug, c.seq),
    note,
    url,
  });
  await notify(c.project.id, "case.changes_requested", {
    title: `Changes requested: ${c.title}`,
    url,
    tone: "bad",
    fields: [
      { label: "Reviewer", value: session.name },
      { label: "Note", value: note.slice(0, 140) },
    ],
  });

  revalidatePath(`/projects/${c.project.slug}/cases/${caseId}`);
  return { ok: true };
}
