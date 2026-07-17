"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { can } from "@/lib/permissions";
import { saveAttachment } from "@/lib/attachments";
import { SESSION_NOTE_KINDS } from "@/lib/constants";
import { providerFor, displayIssueKey } from "@/lib/issue-providers";
import { resolveIntegration } from "@/app/actions/issues";

// F-25: exploratory / session-based testing. A session is single-player —
// only the tester who started it may add notes or end it (mirrors run
// execution); any project member may read it.

type ActionResult = { error?: string; ok?: boolean } | undefined;

async function ownedActiveSession(sessionId: string, userId: string) {
  const session = await db.session.findFirst({
    where: { id: sessionId, project: { members: { some: { userId } } } },
    include: { project: { select: { id: true, slug: true } } },
  });
  if (!session) notFound();
  if (session.testerId !== userId) return { error: "Only the tester who started this session may act on it." } as const;
  if (session.status !== "ACTIVE") return { error: "This session has already ended." } as const;
  return { session } as const;
}

export async function startSession(formData: FormData): Promise<void> {
  const auth = await requireSession();
  const projectId = String(formData.get("projectId"));
  if (!(await isProjectMember(auth.userId, projectId))) return;
  if (!(await can(auth.userId, projectId, "run.execute"))) return;

  const charter = String(formData.get("charter") ?? "").trim();
  if (!charter) return;
  const timeboxMinutes = Math.max(
    5,
    Math.min(240, parseInt(String(formData.get("timeboxMinutes") ?? "30"), 10) || 30)
  );

  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  const created = await db.session.create({
    data: { projectId, charter, timeboxMinutes, testerId: auth.userId },
  });
  await logAudit({
    userId: auth.userId,
    action: "session.start",
    entityType: "session",
    entityId: created.id,
    detail: charter,
  });
  redirect(`/projects/${project.slug}/sessions/${created.id}`);
}

export async function addNote(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireSession();
  const sessionId = String(formData.get("sessionId"));
  const owned = await ownedActiveSession(sessionId, auth.userId);
  if ("error" in owned) return owned;

  const kind = String(formData.get("kind") ?? "NOTE");
  if (!(SESSION_NOTE_KINDS as readonly string[]).includes(kind))
    return { error: "Invalid note kind." };
  const bodyMd = String(formData.get("bodyMd") ?? "").trim();
  if (!bodyMd) return { error: "Note text is required." };

  const note = await db.sessionNote.create({
    data: { sessionId, kind, bodyMd },
  });

  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    await saveAttachment({
      projectId: owned.session.projectId,
      uploaderId: auth.userId,
      entityType: "SESSION_NOTE",
      entityId: note.id,
      filename: file.name,
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()),
    });
  }

  revalidatePath(`/projects/${owned.session.project.slug}/sessions/${sessionId}`);
  return { ok: true };
}

export async function endSession(formData: FormData): Promise<void> {
  const auth = await requireSession();
  const sessionId = String(formData.get("sessionId"));
  const owned = await ownedActiveSession(sessionId, auth.userId);
  if ("error" in owned) return;

  await db.session.update({
    where: { id: sessionId },
    data: { status: "ENDED", endedAt: new Date() },
  });
  await logAudit({
    userId: auth.userId,
    action: "session.end",
    entityType: "session",
    entityId: sessionId,
  });
  await dispatchWebhook(owned.session.projectId, "session.completed", {
    id: sessionId,
    charter: owned.session.charter,
  });
  revalidatePath(`/projects/${owned.session.project.slug}/sessions/${sessionId}`);
  revalidatePath(`/projects/${owned.session.project.slug}/sessions`);
}

// IDEA → draft test case. Title is the note's first line (truncated);
// the full note becomes the description. Requires case.write in addition
// to session ownership, since it creates a real case.
export async function convertNoteToCase(formData: FormData): Promise<void> {
  const auth = await requireSession();
  const noteId = String(formData.get("noteId"));
  const note = await db.sessionNote.findFirst({
    where: { id: noteId, session: { project: { members: { some: { userId: auth.userId } } } } },
    include: { session: { include: { project: { select: { id: true, slug: true } } } } },
  });
  if (!note) return;
  if (note.convertedType) return;
  if (note.session.testerId !== auth.userId) return;
  const projectId = note.session.project.id;
  if (!(await can(auth.userId, projectId, "case.write"))) return;

  const title = note.bodyMd.split("\n")[0].trim().slice(0, 200) || "Untitled idea";
  const project = await db.project.update({
    where: { id: projectId },
    data: { caseCounter: { increment: 1 } },
  });
  const testCase = await db.testCase.create({
    data: {
      projectId,
      seq: project.caseCounter,
      title,
      description: note.bodyMd,
      status: "DRAFT",
    },
  });
  await db.sessionNote.update({
    where: { id: noteId },
    data: { convertedType: "CASE", convertedId: testCase.id },
  });
  await logAudit({
    userId: auth.userId,
    action: "session.note_to_case",
    entityType: "case",
    entityId: testCase.id,
    detail: title,
  });
  revalidatePath(`/projects/${note.session.project.slug}/sessions/${note.sessionId}`);
}

// BUG → filed issue on the project's configured tracker (F-07). Degrades to
// an error (never silently) when no tracker is configured.
export async function convertNoteToIssue(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const auth = await requireSession();
  const noteId = String(formData.get("noteId"));
  const note = await db.sessionNote.findFirst({
    where: { id: noteId, session: { project: { members: { some: { userId: auth.userId } } } } },
    include: { session: { include: { project: { select: { id: true, slug: true } } } } },
  });
  if (!note) return { error: "Note not found." };
  if (note.convertedType) return { error: "This note was already converted." };
  if (note.session.testerId !== auth.userId)
    return { error: "Only the tester who started this session may convert its notes." };
  const projectId = note.session.project.id;
  if (!(await can(auth.userId, projectId, "run.execute")))
    return { error: "You don't have permission to file issues." };

  const resolved = await resolveIntegration(
    auth.userId,
    projectId,
    String(formData.get("provider") ?? "") || undefined
  );
  if ("error" in resolved) return { error: resolved.error };
  const { integration } = resolved;

  const title = note.bodyMd.split("\n")[0].trim().slice(0, 200) || "Exploratory session bug";
  let issue;
  try {
    issue = await providerFor(integration).createIssue({ title, body: note.bodyMd });
  } catch (err) {
    return { error: `Could not create the issue: ${(err as Error).message}` };
  }

  await db.issueLink.create({
    data: {
      projectId,
      provider: integration.provider,
      issueKey: issue.key,
      issueUrl: issue.url,
      title,
      entityType: "SESSION_NOTE",
      entityId: noteId,
    },
  });
  await db.sessionNote.update({
    where: { id: noteId },
    data: { convertedType: "ISSUE", convertedId: issue.key },
  });
  await logAudit({
    userId: auth.userId,
    action: "session.note_to_issue",
    entityType: "session_note",
    entityId: noteId,
    detail: `${integration.provider} ${displayIssueKey(integration.provider, issue.key)}`,
  });
  revalidatePath(`/projects/${note.session.project.slug}/sessions/${note.sessionId}`);
  return { ok: true };
}
