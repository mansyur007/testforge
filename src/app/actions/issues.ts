"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { dispatchWebhook } from "@/lib/webhooks";
import { notify } from "@/lib/notifications";
import { draftIssueFromResult, serializeIssueLink } from "@/lib/issues";
import {
  parseIssueKey,
  providerFor,
  displayIssueKey,
} from "@/lib/issue-providers";
import { can } from "@/lib/permissions";

// F-07: create an issue from a failed result, and link/unlink existing issues.
// Every path here re-checks project membership; nothing returns `authEnc` or a
// decrypted credential.

type ActionResult = { error?: string; ok?: boolean; url?: string };

/** The project's active integration for `provider`, or the only one if the
 * caller didn't name a provider. Also enforces tenant access. */
export async function resolveIntegration(userId: string, projectId: string, provider?: string) {
  const member = await db.project.findFirst({
    where: { id: projectId, members: { some: { userId } } },
    select: { id: true, slug: true },
  });
  if (!member) return { error: "Project not found." } as const;

  const integrations = await db.integration.findMany({
    where: { projectId, active: true, ...(provider ? { provider } : {}) },
  });
  if (integrations.length === 0)
    return { error: "No active issue tracker is configured for this project." } as const;
  if (integrations.length > 1 && !provider)
    return { error: "Several trackers are configured — pick one." } as const;
  return { integration: integrations[0], slug: member.slug } as const;
}

/** Preview the issue that would be filed for a result (title + body), so the
 * modal can show it before anything is sent upstream. */
export async function previewIssueFromResult(
  resultId: string
): Promise<{ title: string; body: string } | { error: string }> {
  const session = await requireSession();
  const owned = await db.testRunResult.findFirst({
    where: {
      id: resultId,
      run: { project: { members: { some: { userId: session.userId } } } },
    },
    select: { id: true },
  });
  if (!owned) return { error: "Result not found." };

  const draft = await draftIssueFromResult(resultId);
  return draft ?? { error: "Result not found." };
}

export async function createIssueFromResult(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();

  const resultId = String(formData.get("resultId"));
  const result = await db.testRunResult.findFirst({
    where: {
      id: resultId,
      run: { project: { members: { some: { userId: session.userId } } } },
    },
    include: { run: { select: { projectId: true, id: true } } },
  });
  if (!result) return { error: "Result not found." };
  // F-14: filing/linking issues follows the executor permission.
  if (!(await can(session.userId, result.run.projectId, "run.execute")))
    return { error: "You don't have permission to file issues." };

  const resolved = await resolveIntegration(
    session.userId,
    result.run.projectId,
    String(formData.get("provider") ?? "") || undefined
  );
  if ("error" in resolved) return { error: resolved.error };
  const { integration, slug } = resolved;

  const draft = await draftIssueFromResult(resultId);
  if (!draft) return { error: "Result not found." };

  // The modal lets the reporter edit the generated text before filing.
  const title = String(formData.get("title") ?? "").trim() || draft.title;
  const body = String(formData.get("body") ?? "").trim() || draft.body;

  let issue;
  try {
    issue = await providerFor(integration).createIssue({ title, body });
  } catch (err) {
    return { error: `Could not create the issue: ${(err as Error).message}` };
  }

  const link = await db.issueLink.create({
    data: {
      projectId: integration.projectId,
      provider: integration.provider,
      issueKey: issue.key,
      issueUrl: issue.url,
      title,
      entityType: "RESULT",
      entityId: resultId,
    },
  });
  // Keep the legacy plain-URL field working (reports read it).
  await db.testRunResult.update({
    where: { id: resultId },
    data: { defectUrl: issue.url },
  });

  await logAudit({
    userId: session.userId,
    action: "issue.create",
    entityType: "result",
    entityId: resultId,
    detail: `${integration.provider} ${displayIssueKey(integration.provider, issue.key)}`,
  });
  await dispatchWebhook(
    integration.projectId,
    "issue.created",
    serializeIssueLink(link)
  );
  await notify(integration.projectId, "issue.created", {
    title: `Issue filed: ${title}`,
    url: issue.url,
    tone: "bad",
    fields: [
      { label: "Tracker", value: integration.provider },
      { label: "Key", value: displayIssueKey(integration.provider, issue.key) },
    ],
  });

  revalidatePath(`/projects/${slug}/runs/${result.run.id}`);
  return { ok: true, url: issue.url };
}

/** Link an issue that already exists, by key ("QA-123", "#42") or full URL.
 * The key is validated against the tracker so a typo can't be stored. */
export async function linkIssue(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const session = await requireSession();

  const entityType = String(formData.get("entityType"));
  const entityId = String(formData.get("entityId"));
  if (entityType !== "CASE" && entityType !== "RESULT")
    return { error: "Unsupported entity." };

  // Resolve the owning project through the entity itself (tenant guard).
  const projectId =
    entityType === "CASE"
      ? (
          await db.testCase.findFirst({
            where: {
              id: entityId,
              project: { members: { some: { userId: session.userId } } },
            },
            select: { projectId: true },
          })
        )?.projectId
      : (
          await db.testRunResult.findFirst({
            where: {
              id: entityId,
              run: { project: { members: { some: { userId: session.userId } } } },
            },
            select: { run: { select: { projectId: true } } },
          })
        )?.run.projectId;
  if (!projectId) return { error: "Entity not found." };
  // F-14: filing/linking issues follows the executor permission.
  if (!(await can(session.userId, projectId, "run.execute")))
    return { error: "You don't have permission to link issues." };

  const resolved = await resolveIntegration(
    session.userId,
    projectId,
    String(formData.get("provider") ?? "") || undefined
  );
  if ("error" in resolved) return { error: resolved.error };
  const { integration, slug } = resolved;

  const raw = String(formData.get("issueKey") ?? "");
  const key = parseIssueKey(integration.provider, raw);
  if (!key)
    return {
      error:
        integration.provider === "JIRA"
          ? "Enter a Jira key like QA-123, or the issue URL."
          : "Enter an issue number like #42, or the issue URL.",
    };

  const existing = await db.issueLink.findFirst({
    where: { projectId, provider: integration.provider, issueKey: key, entityType, entityId },
  });
  if (existing) return { error: "That issue is already linked here." };

  let issue;
  try {
    issue = await providerFor(integration).getIssue(key);
  } catch (err) {
    return { error: `Could not read the issue: ${(err as Error).message}` };
  }

  await db.issueLink.create({
    data: {
      projectId,
      provider: integration.provider,
      issueKey: issue.key,
      issueUrl: issue.url,
      title: issue.title ?? null,
      status: issue.status ?? null,
      syncedAt: new Date(),
      entityType,
      entityId,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "issue.link",
    entityType: entityType.toLowerCase(),
    entityId,
    detail: `${integration.provider} ${displayIssueKey(integration.provider, issue.key)}`,
  });
  revalidatePath(`/projects/${slug}`);
  return { ok: true, url: issue.url };
}

export async function unlinkIssue(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("linkId"));
  const link = await db.issueLink.findFirst({
    where: { id, project: { members: { some: { userId: session.userId } } } },
    include: { project: { select: { slug: true } } },
  });
  if (!link) return;

  await db.issueLink.delete({ where: { id } });
  await logAudit({
    userId: session.userId,
    action: "issue.unlink",
    entityType: link.entityType.toLowerCase(),
    entityId: link.entityId,
    detail: `${link.provider} ${displayIssueKey(link.provider, link.issueKey)}`,
  });
  revalidatePath(`/projects/${link.project.slug}`);
}
