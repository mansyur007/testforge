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

  const raw = `tf_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(raw).digest("hex");

  await db.apiKey.create({
    data: {
      userId: session.userId,
      name,
      prefix: raw.slice(0, 11),
      keyHash,
      scope,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "apikey.create",
    detail: `${name} (${scope.toLowerCase()})`,
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
