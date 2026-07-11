import { db } from "@/lib/db";

// F-19: named environments (Staging, Prod, …) a run can be tagged against.

export function loadEnvironments(projectId: string) {
  return db.environment.findMany({
    where: { projectId },
    orderBy: { order: "asc" },
  });
}

/**
 * Resolves the &env=<name> query param used by the F-11 automation-upload
 * endpoints to an Environment id, auto-creating it when the project allows
 * it (Project.autoCreateEnvs, default on). Inactive/missing when disabled.
 */
export async function resolveOrCreateEnvironment(
  projectId: string,
  name: string | null
): Promise<string | null> {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = await db.environment.findUnique({
    where: { projectId_name: { projectId, name: trimmed } },
  });
  if (existing) return existing.id;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { autoCreateEnvs: true },
  });
  if (!project?.autoCreateEnvs) return null;

  const last = await db.environment.findFirst({
    where: { projectId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const created = await db.environment.create({
    data: { projectId, name: trimmed, order: (last?.order ?? -1) + 1 },
  });
  return created.id;
}
