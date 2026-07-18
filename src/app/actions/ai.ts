"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { isProjectMember } from "@/lib/projects";
import { can } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { recordRevision } from "@/lib/case-revisions";
import { PRIORITIES, CASE_TYPES } from "@/lib/constants";
import {
  AiError,
  aiConfigured,
  generateCasesFromText,
  orgIdForUser,
  saveAiConfig,
  suggestEdgeSteps,
  type DraftCase,
} from "@/lib/ai";

// F-29: AI assist actions. Config is org-ADMIN only; content actions require
// case.write on the project. Every AI action is opt-in per user click and
// returns a friendly error rather than throwing when misconfigured.

async function requireOrgAdmin(userId: string): Promise<string> {
  const session = await requireSession();
  if (session.role !== "ADMIN") throw new Error("Organization admin required.");
  const orgId = await orgIdForUser(userId);
  if (!orgId) throw new Error("No organization.");
  return orgId;
}

export async function saveAiSettings(
  _prev: { error?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const session = await requireSession();
  if (session.role !== "ADMIN")
    return { error: "Only organization admins can change AI settings." };
  const orgId = await orgIdForUser(session.userId);
  if (!orgId) return { error: "No organization." };

  await saveAiConfig(orgId, {
    endpoint: String(formData.get("endpoint") ?? ""),
    model: String(formData.get("model") ?? ""),
    apiKey: String(formData.get("apiKey") ?? ""),
    clearKey: formData.get("clearKey") === "1",
  });
  await logAudit({
    userId: session.userId,
    action: "ai.config_update",
    entityType: "organization",
    entityId: orgId,
    detail: formData.get("clearKey") === "1" ? "disabled" : "updated",
  });
  revalidatePath("/settings/ai");
  return { ok: true };
}

/** ADMIN: verify the endpoint + key with a tiny live call. */
export async function testAiConnection(): Promise<{ ok: boolean; message: string }> {
  const session = await requireSession();
  try {
    const orgId = await requireOrgAdmin(session.userId);
    if (!(await aiConfigured(orgId)))
      return { ok: false, message: "No API key configured yet." };
    // A minimal generation round-trips the endpoint, key, and model.
    await suggestEdgeSteps(orgId, { title: "Connectivity check", steps: [] });
    return { ok: true, message: "Connection successful." };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof AiError ? e.message : (e as Error).message,
    };
  }
}

async function projectWriteOrThrow(userId: string, projectId: string) {
  if (!(await isProjectMember(userId, projectId)))
    throw new AiError("Project not found.");
  if (!(await can(userId, projectId, "case.write")))
    throw new AiError("You don't have permission to create test cases.");
  const orgId = await orgIdForUser(userId);
  if (!orgId) throw new AiError("No organization.");
  return orgId;
}

/** Feature 1a: preview draft cases from a requirement (no writes). */
export async function generateCasesPreview(
  projectId: string,
  requirement: string
): Promise<{ cases?: DraftCase[]; error?: string }> {
  const session = await requireSession();
  try {
    const orgId = await projectWriteOrThrow(session.userId, projectId);
    if (!requirement.trim()) return { error: "Paste a requirement first." };
    const cases = await generateCasesFromText(orgId, requirement);
    if (cases.length === 0) return { error: "The AI didn't propose any cases." };
    return { cases };
  } catch (e) {
    return { error: e instanceof AiError ? e.message : "AI request failed." };
  }
}

/** Feature 1b: insert selected drafts as DRAFT-status cases. */
export async function insertDraftCases(
  projectId: string,
  cases: DraftCase[]
): Promise<{ created?: number; error?: string }> {
  const session = await requireSession();
  try {
    await projectWriteOrThrow(session.userId, projectId);
  } catch (e) {
    return { error: e instanceof AiError ? e.message : "Not allowed." };
  }
  if (!cases.length) return { error: "Select at least one case to insert." };

  const validPriority = new Set<string>(PRIORITIES);
  const validType = new Set<string>(CASE_TYPES);
  let created = 0;
  for (const c of cases.slice(0, 12)) {
    const title = c.title?.trim();
    if (!title) continue;
    const project = await db.project.update({
      where: { id: projectId },
      data: { caseCounter: { increment: 1 } },
    });
    const testCase = await db.testCase.create({
      data: {
        projectId,
        seq: project.caseCounter,
        title: title.slice(0, 200),
        status: "DRAFT", // brief: AI-generated cases land as DRAFT
        priority: validPriority.has(c.priority) ? c.priority : "MEDIUM",
        type: validType.has(c.type) ? c.type : "FUNCTIONAL",
        preconditions: c.preconditions?.trim() || null,
        stepsJson: JSON.stringify(
          (c.steps ?? [])
            .filter((s) => s.action?.trim())
            .map((s) => ({ action: s.action.trim(), expected: (s.expected ?? "").trim() }))
        ),
        expectedResult: c.expectedResult?.trim() || null,
      },
    });
    await recordRevision(testCase.id, session.userId); // F-05: rev 1
    await logAudit({
      userId: session.userId,
      action: "case.create",
      entityType: "case",
      entityId: testCase.id,
      detail: `${title} (AI draft)`,
    });
    created++;
  }
  const proj = await db.project.findUnique({
    where: { id: projectId },
    select: { slug: true },
  });
  if (proj) revalidatePath(`/projects/${proj.slug}`);
  return { created };
}

/** Feature 2: suggest additional edge-case steps for an existing case. */
export async function suggestStepsForCase(
  caseId: string
): Promise<{ steps?: { action: string; expected: string }[]; error?: string }> {
  const session = await requireSession();
  const testCase = await db.testCase.findFirst({
    where: {
      id: caseId,
      project: { members: { some: { userId: session.userId } } },
    },
    select: { projectId: true, title: true, stepsJson: true },
  });
  if (!testCase) return { error: "Case not found." };
  try {
    const orgId = await projectWriteOrThrow(session.userId, testCase.projectId);
    const raw = JSON.parse(testCase.stepsJson || "[]");
    const steps = Array.isArray(raw)
      ? raw
          .filter((s) => s && typeof s.action === "string")
          .map((s) => ({ action: String(s.action), expected: String(s.expected ?? "") }))
      : [];
    const suggestions = await suggestEdgeSteps(orgId, { title: testCase.title, steps });
    return { steps: suggestions };
  } catch (e) {
    return { error: e instanceof AiError ? e.message : "AI request failed." };
  }
}
