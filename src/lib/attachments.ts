import type { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

// F-01 shared attachment rules & helpers.

// Only these render inline in the browser. Everything else (incl. SVG and
// HTML — stored-XSS vectors) is forced to download as an octet-stream.
export const INLINE_IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];

export const ATTACHMENT_ENTITY_TYPES = [
  "CASE",
  "RESULT",
  "COMMENT",
  "SESSION_NOTE",
] as const;

export function maxUploadBytes(): number {
  const mb = parseInt(process.env.TF_MAX_UPLOAD_MB ?? "10", 10);
  return (Number.isFinite(mb) && mb > 0 ? mb : 10) * 1024 * 1024;
}

// Keep the original name recognizable but strip paths and control chars.
export function sanitizeFilename(name: string): string {
  const base = (name.split(/[/\\]/).pop() ?? "").trim().slice(0, 200);
  const clean = Array.from(base)
    .filter((c) => {
      const cp = c.codePointAt(0)!;
      return cp >= 32 && cp !== 127;
    })
    .join("")
    .trim();
  return clean || "file";
}

// ASCII-only variant for the Content-Disposition header value.
export function headerFilename(name: string): string {
  const ascii = Array.from(name)
    .map((c) => {
      const cp = c.codePointAt(0)!;
      return cp >= 32 && cp < 127 && c !== '"' ? c : "_";
    })
    .join("");
  return ascii || "file";
}

/**
 * Store an upload and create its row. Dedupe: identical content (sha256)
 * already stored in the same project reuses the existing storageKey — the
 * bytes are written to disk only once (VPS storage is small).
 */
export async function saveAttachment(input: {
  projectId: string;
  uploaderId: string;
  entityType: string;
  entityId: string;
  filename: string;
  mimeType: string;
  data: Buffer;
}) {
  const sha256 = crypto.createHash("sha256").update(input.data).digest("hex");
  const twin = await db.attachment.findFirst({
    where: { projectId: input.projectId, sha256 },
    select: { storageKey: true },
  });
  const storageKey =
    twin?.storageKey ?? `p_${input.projectId}/${crypto.randomUUID()}`;
  if (!twin) await getStorage().put(storageKey, input.data);

  return db.attachment.create({
    data: {
      projectId: input.projectId,
      uploaderId: input.uploaderId,
      entityType: input.entityType,
      entityId: input.entityId,
      filename: sanitizeFilename(input.filename),
      mimeType: input.mimeType || "application/octet-stream",
      sizeBytes: input.data.byteLength,
      sha256,
      storageKey,
    },
  });
}

/**
 * Delete attachment rows and, for every storageKey no longer referenced by
 * any remaining row (dedupe-aware), the file on disk. Returns rows removed.
 */
export async function removeAttachments(
  where: Prisma.AttachmentWhereInput
): Promise<number> {
  const rows = await db.attachment.findMany({
    where,
    select: { id: true, storageKey: true },
  });
  if (rows.length === 0) return 0;

  await db.attachment.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });

  const storage = getStorage();
  for (const key of Array.from(new Set(rows.map((r) => r.storageKey)))) {
    const stillUsed = await db.attachment.count({ where: { storageKey: key } });
    if (stillUsed === 0) await storage.delete(key);
  }
  return rows.length;
}

/**
 * Orphan sweep for the purge cron: attachments whose owning entity was
 * hard-deleted. Soft-deleted cases still count as existing (restorable).
 */
export async function sweepOrphanAttachments(): Promise<number> {
  const atts = await db.attachment.findMany({
    select: { id: true, entityType: true, entityId: true },
  });
  if (atts.length === 0) return 0;

  const caseIds = atts.filter((a) => a.entityType === "CASE").map((a) => a.entityId);
  const resultIds = atts.filter((a) => a.entityType === "RESULT").map((a) => a.entityId);
  // F-16: a comment attachment is orphaned once its comment is hard-deleted.
  const commentIds = atts.filter((a) => a.entityType === "COMMENT").map((a) => a.entityId);

  const [cases, results, comments] = await Promise.all([
    db.testCase.findMany({ where: { id: { in: caseIds } }, select: { id: true } }),
    db.testRunResult.findMany({ where: { id: { in: resultIds } }, select: { id: true } }),
    db.comment.findMany({ where: { id: { in: commentIds } }, select: { id: true } }),
  ]);
  const alive = new Set([
    ...cases.map((c) => c.id),
    ...results.map((r) => r.id),
    ...comments.map((c) => c.id),
  ]);

  const orphanIds = atts
    .filter(
      (a) =>
        ["CASE", "RESULT", "COMMENT"].includes(a.entityType) &&
        !alive.has(a.entityId)
    )
    .map((a) => a.id);
  if (orphanIds.length === 0) return 0;
  return removeAttachments({ id: { in: orphanIds } });
}
