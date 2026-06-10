import { db } from "./db";

/** Audit log sesuai PRD §5.5 — semua aksi penting tercatat. */
export async function logAudit(params: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        detail: params.detail,
      },
    });
  } catch {
    // audit log tidak boleh menggagalkan operasi utama
  }
}
