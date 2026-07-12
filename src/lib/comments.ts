import type { Comment, User } from "@prisma/client";
import { db } from "@/lib/db";

// F-16: comments on a case, run, or run result. Mentions are stored inline in
// the raw body as `@[userId]` tokens (cuid userIds), rendered as name chips and
// used to notify the mentioned members. Keeping the token in the body makes the
// body the single source of truth — even a hand-written token works.

export const COMMENT_ENTITY_TYPES = ["CASE", "RUN", "RESULT"] as const;
export type CommentEntityType = (typeof COMMENT_ENTITY_TYPES)[number];

// cuid()s are [a-z0-9]; anchoring to that keeps the token unambiguous.
const MENTION_RE = /@\[([a-z0-9]+)\]/g;

/** Distinct userIds referenced by `@[userId]` tokens in a raw comment body. */
export function parseMentionIds(bodyMd: string): string[] {
  const ids = new Set<string>();
  Array.from(bodyMd.matchAll(MENTION_RE)).forEach((m) => ids.add(m[1]));
  return Array.from(ids);
}

/**
 * Turn the display body the composer submits (mentions typed as `@Name`) into
 * the stored form (`@[userId]`). Driven by the explicit list of members the
 * user actually picked from autocomplete — never by guessing from names — so a
 * name that is a substring of another can't be mis-encoded. Longer names first
 * so "@Ann Marie" is matched before "@Ann".
 */
export function encodeMentions(
  body: string,
  users: { id: string; name: string }[]
): string {
  let out = body;
  const ordered = [...users].sort((a, b) => b.name.length - a.name.length);
  for (const u of ordered) {
    if (!u.name.trim()) continue;
    // Replace only the first still-unencoded `@Name`; a mention repeated in the
    // body keeps its later occurrences as plain text (one notify per user).
    const needle = `@${u.name}`;
    const idx = out.indexOf(needle);
    if (idx !== -1) {
      out = out.slice(0, idx) + `@[${u.id}]` + out.slice(idx + needle.length);
    }
  }
  return out;
}

/** userId -> display name for every member of the entity's project. */
export async function loadMemberNames(
  projectId: string
): Promise<Map<string, string>> {
  const members = await db.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true } } },
  });
  return new Map(members.map((m) => [m.user.id, m.user.name]));
}

/**
 * Resolve the entity a comment targets, but only when it lives in a project the
 * user belongs to. Returns the projectId (needed for the row + notifications)
 * or null when the entity is missing or out of the caller's tenant.
 */
export async function resolveCommentTarget(
  userId: string,
  entityType: string,
  entityId: string
): Promise<{ projectId: string; slug: string } | null> {
  const memberFilter = { members: { some: { userId } } };
  if (entityType === "CASE") {
    const c = await db.testCase.findFirst({
      where: { id: entityId, project: memberFilter },
      select: { project: { select: { id: true, slug: true } } },
    });
    return c ? { projectId: c.project.id, slug: c.project.slug } : null;
  }
  if (entityType === "RUN") {
    const r = await db.testRun.findFirst({
      where: { id: entityId, project: memberFilter },
      select: { project: { select: { id: true, slug: true } } },
    });
    return r ? { projectId: r.project.id, slug: r.project.slug } : null;
  }
  if (entityType === "RESULT") {
    const r = await db.testRunResult.findFirst({
      where: { id: entityId, run: { project: memberFilter } },
      select: { run: { select: { project: { select: { id: true, slug: true } } } } },
    });
    return r ? { projectId: r.run.project.id, slug: r.run.project.slug } : null;
  }
  return null;
}

/**
 * Deep link to the entity a comment lives on (for mention notifications).
 * A RESULT lives inside its run, so its link points at the run — pass the
 * owning runId as `runId` (the caller looks it up).
 */
export function commentEntityUrl(
  baseUrl: string,
  slug: string,
  entityType: string,
  entityId: string,
  runId?: string
): string {
  if (entityType === "CASE") return `${baseUrl}/projects/${slug}/cases/${entityId}`;
  if (entityType === "RUN") return `${baseUrl}/projects/${slug}/runs/${entityId}`;
  if (entityType === "RESULT" && runId)
    return `${baseUrl}/projects/${slug}/runs/${runId}`;
  return `${baseUrl}/projects/${slug}`;
}

export type CommentView = {
  id: string;
  authorId: string;
  authorName: string;
  bodyMd: string;
  // Names for the `@[userId]` tokens in this body, so the client renders chips
  // without a second lookup. A mention of a now-removed member falls back to id.
  mentionNames: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
  deleted: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function serializeComment(
  c: Comment & { author: Pick<User, "id" | "name"> },
  viewer: { userId: string; canModerate: boolean },
  memberNames: Map<string, string>
): CommentView {
  const deleted = c.deletedAt != null;
  const mine = c.authorId === viewer.userId;
  const mentionNames: Record<string, string> = {};
  if (!deleted)
    for (const id of parseMentionIds(c.bodyMd))
      mentionNames[id] = memberNames.get(id) ?? "unknown";
  return {
    id: c.id,
    authorId: c.authorId,
    authorName: c.author.name,
    bodyMd: deleted ? "" : c.bodyMd,
    mentionNames,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    edited: !deleted && c.editedAt != null,
    deleted,
    canEdit: !deleted && mine,
    canDelete: !deleted && (mine || viewer.canModerate),
  };
}
