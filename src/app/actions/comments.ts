"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify, notifyBaseUrl } from "@/lib/notifications";
import { sendMail, actionEmailHtml } from "@/lib/mailer";
import { removeAttachments } from "@/lib/attachments";
import {
  COMMENT_ENTITY_TYPES,
  encodeMentions,
  parseMentionIds,
  resolveCommentTarget,
  commentEntityUrl,
  serializeComment,
  loadMemberNames,
  type CommentView,
} from "@/lib/comments";

// F-16: comment CRUD. Reads (listComments) and writes both go through server
// actions so the CommentPanel works identically on the case page, the run page,
// and inside the fully-client run executor (no page navigation to refresh).

export type CommentInput = {
  entityType: string;
  entityId: string;
  body: string;
  // userIds the author picked from the @mention autocomplete (drives encoding).
  mentionUserIds?: string[];
};

type CommentResult = { error?: string; comments?: CommentView[] };

/** OWNER/ADMIN of the project (or an org ADMIN) may delete anyone's comment. */
async function viewerContext(userId: string, projectId: string, orgRole: string) {
  const membership = await db.projectMember.findFirst({
    where: { projectId, userId },
    select: { role: true },
  });
  const canModerate =
    orgRole === "ADMIN" || ["OWNER", "ADMIN"].includes(membership?.role ?? "");
  return { userId, canModerate };
}

async function loadCommentViews(
  userId: string,
  orgRole: string,
  projectId: string,
  entityType: string,
  entityId: string
): Promise<CommentView[]> {
  const viewer = await viewerContext(userId, projectId, orgRole);
  const [rows, memberNames] = await Promise.all([
    db.comment.findMany({
      where: { projectId, entityType, entityId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" }, // flat list, newest last
    }),
    loadMemberNames(projectId),
  ]);
  return rows.map((c) => serializeComment(c, viewer, memberNames));
}

export async function listComments(
  entityType: string,
  entityId: string
): Promise<CommentView[]> {
  const session = await requireSession();
  const target = await resolveCommentTarget(session.userId, entityType, entityId);
  if (!target) return [];
  return loadCommentViews(
    session.userId,
    session.role,
    target.projectId,
    entityType,
    entityId
  );
}

/** Notify mentioned members: project channels + a personal email fallback. */
async function notifyMentions(
  projectId: string,
  slug: string,
  entityType: string,
  entityId: string,
  authorName: string,
  bodyMd: string,
  mentionedIds: string[]
) {
  if (mentionedIds.length === 0) return;

  // RESULT deep-links to its run, so resolve the runId once.
  let runId: string | undefined;
  if (entityType === "RESULT") {
    const r = await db.testRunResult.findUnique({
      where: { id: entityId },
      select: { runId: true },
    });
    runId = r?.runId;
  }
  const url = commentEntityUrl(notifyBaseUrl(), slug, entityType, entityId, runId);
  const preview = bodyMd.replace(/@\[[a-z0-9]+\]/g, "@…").slice(0, 140);

  await dispatchWebhook(projectId, "comment.mentioned", {
    entityType,
    entityId,
    author: authorName,
    mentionedUserIds: mentionedIds,
    url,
  });
  await notify(projectId, "comment.mentioned", {
    title: `${authorName} mentioned someone in a comment`,
    url,
    fields: [{ label: "Comment", value: preview || "(no text)" }],
  });

  // Personal email to each mentioned member (best-effort; dev logs when no SMTP).
  const users = await db.user.findMany({
    where: { id: { in: mentionedIds } },
    select: { email: true, name: true },
  });
  for (const u of users) {
    await sendMail({
      to: u.email,
      subject: `[TestForge] ${authorName} mentioned you in a comment`,
      html: actionEmailHtml({
        heading: `${authorName} mentioned you`,
        body: preview || "You were mentioned in a comment.",
        buttonLabel: "View comment",
        actionUrl: url,
      }),
      text: `${authorName} mentioned you in a comment.\n${preview}\n${url}`,
    }).catch(() => {});
  }
}

export async function createComment(input: CommentInput): Promise<CommentResult> {
  const session = await requireSession();
  const { entityType, entityId } = input;
  if (!COMMENT_ENTITY_TYPES.includes(entityType as never))
    return { error: "Unknown comment target." };

  const target = await resolveCommentTarget(session.userId, entityType, entityId);
  if (!target) return { error: "Not found." };

  const body = String(input.body ?? "").trim();
  if (!body) return { error: "Comment can't be empty." };
  if (body.length > 10000) return { error: "Comment is too long." };

  // Encode the picked mentions (@Name -> @[userId]) using their real names,
  // but only members that actually belong to this project.
  const picked = (input.mentionUserIds ?? []).filter(Boolean);
  const pickedUsers = picked.length
    ? (
        await db.projectMember.findMany({
          where: { projectId: target.projectId, userId: { in: picked } },
          include: { user: { select: { id: true, name: true } } },
        })
      ).map((m) => m.user)
    : [];
  const encoded = encodeMentions(body, pickedUsers);

  const comment = await db.comment.create({
    data: {
      projectId: target.projectId,
      entityType,
      entityId,
      authorId: session.userId,
      bodyMd: encoded,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "comment.create",
    entityType: "comment",
    entityId: comment.id,
    detail: `${entityType} ${entityId}`,
  });

  const mentioned = parseMentionIds(encoded).filter((id) => id !== session.userId);
  await notifyMentions(
    target.projectId,
    target.slug,
    entityType,
    entityId,
    session.name,
    encoded,
    mentioned
  );

  return {
    comments: await loadCommentViews(
      session.userId,
      session.role,
      target.projectId,
      entityType,
      entityId
    ),
  };
}

export async function editComment(input: {
  commentId: string;
  body: string;
  mentionUserIds?: string[];
}): Promise<CommentResult> {
  const session = await requireSession();
  const existing = await db.comment.findFirst({
    where: {
      id: input.commentId,
      project: { members: { some: { userId: session.userId } } },
    },
  });
  if (!existing || existing.deletedAt) return { error: "Comment not found." };
  if (existing.authorId !== session.userId)
    return { error: "You can only edit your own comments." };

  const body = String(input.body ?? "").trim();
  if (!body) return { error: "Comment can't be empty." };
  if (body.length > 10000) return { error: "Comment is too long." };

  const picked = (input.mentionUserIds ?? []).filter(Boolean);
  const pickedUsers = picked.length
    ? (
        await db.projectMember.findMany({
          where: { projectId: existing.projectId, userId: { in: picked } },
          include: { user: { select: { id: true, name: true } } },
        })
      ).map((m) => m.user)
    : [];
  const encoded = encodeMentions(body, pickedUsers);

  const before = new Set(parseMentionIds(existing.bodyMd));
  await db.comment.update({
    where: { id: existing.id },
    data: { bodyMd: encoded, editedAt: new Date() },
  });

  // Only notify members newly mentioned by this edit.
  const newlyMentioned = parseMentionIds(encoded).filter(
    (id) => id !== session.userId && !before.has(id)
  );
  const target = { projectId: existing.projectId };
  const slug =
    (
      await db.project.findUnique({
        where: { id: existing.projectId },
        select: { slug: true },
      })
    )?.slug ?? "";
  await notifyMentions(
    target.projectId,
    slug,
    existing.entityType,
    existing.entityId,
    session.name,
    encoded,
    newlyMentioned
  );

  return {
    comments: await loadCommentViews(
      session.userId,
      session.role,
      existing.projectId,
      existing.entityType,
      existing.entityId
    ),
  };
}

export async function deleteComment(commentId: string): Promise<CommentResult> {
  const session = await requireSession();
  const existing = await db.comment.findFirst({
    where: {
      id: commentId,
      project: { members: { some: { userId: session.userId } } },
    },
  });
  if (!existing || existing.deletedAt) return { error: "Comment not found." };

  const viewer = await viewerContext(session.userId, existing.projectId, session.role);
  if (existing.authorId !== session.userId && !viewer.canModerate)
    return { error: "You can't delete this comment." };

  await db.comment.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });
  // Drop any attachments the comment carried — the body is gone.
  await removeAttachments({ entityType: "COMMENT", entityId: existing.id });

  await logAudit({
    userId: session.userId,
    action: "comment.delete",
    entityType: "comment",
    entityId: existing.id,
    detail: `${existing.entityType} ${existing.entityId}`,
  });

  return {
    comments: await loadCommentViews(
      session.userId,
      session.role,
      existing.projectId,
      existing.entityType,
      existing.entityId
    ),
  };
}
