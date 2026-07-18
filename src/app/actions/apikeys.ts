"use server";

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// API key di-hash sebelum disimpan (PRD §5.5: tidak plaintext).
// Key utuh hanya ditampilkan sekali saat dibuat.
export async function createApiKey(
  _prev: { error?: string; createdKey?: string } | undefined,
  formData: FormData
) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Key name is required." };
  // Read-only keys may only call GET endpoints; write keys can mutate.
  const scope = String(formData.get("scope")) === "READ" ? "READ" : "WRITE";

  // F-33: an empty projectId means org-wide (the v1 default) — the key works
  // across every project its owner belongs to. A set projectId binds the key to
  // that one project, and API v2 rejects it everywhere else.
  const rawProjectId = String(formData.get("projectId") ?? "").trim();
  let projectId: string | null = null;
  if (rawProjectId) {
    // Only a project the caller is actually a member of may be targeted,
    // otherwise this form would be a way to mint a key against any project id.
    const member = await db.projectMember.findFirst({
      where: { projectId: rawProjectId, userId: session.userId },
      select: { projectId: true },
    });
    if (!member) return { error: "You are not a member of that project." };
    projectId = member.projectId;
  }

  // F-33: blank means "use the server default" (API_RATE_LIMIT).
  const rawLimit = String(formData.get("rateLimitPerMin") ?? "").trim();
  let rateLimitPerMin: number | null = null;
  if (rawLimit) {
    const n = Number(rawLimit);
    if (!Number.isInteger(n) || n < 1 || n > 100_000)
      return { error: "Rate limit must be a whole number between 1 and 100000." };
    rateLimitPerMin = n;
  }

  const raw = `tf_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(raw).digest("hex");

  await db.apiKey.create({
    data: {
      userId: session.userId,
      name,
      prefix: raw.slice(0, 11),
      keyHash,
      scope,
      projectId,
      rateLimitPerMin,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "apikey.create",
    detail: `${name} (${scope.toLowerCase()}${projectId ? ", project-scoped" : ""})`,
  });
  revalidatePath("/settings/api-keys");
  return { createdKey: raw };
}

export async function deleteApiKey(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("keyId"));
  await db.apiKey.delete({ where: { id, userId: session.userId } });
  await logAudit({ userId: session.userId, action: "apikey.delete", entityId: id });
  revalidatePath("/settings/api-keys");
}
