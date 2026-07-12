"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { encrypt, decrypt } from "@/lib/crypto";
import {
  PROVIDERS,
  defaultBaseUrl,
  makeProvider,
  providerFor,
  type IntegrationAuth,
  type Provider,
} from "@/lib/issue-providers";
import { can } from "@/lib/permissions";

// F-07: configure a project's issue tracker. OWNER/ADMIN only.
// Credentials are encrypted before they touch the DB and are never echoed
// back, logged, or written into an audit detail.

type ActionResult = { error?: string; ok?: boolean };

async function requireIntegrationAdmin(
  projectId: string
): Promise<{ userId: string; slug: string } | { error: string }> {
  const session = await requireSession();
  // F-14: central permission check (covers custom roles too).
  if (!(await can(session.userId, projectId, "integrations.manage")))
    return { error: "Only project owners/admins can manage integrations." };
  const project = await db.project.findUniqueOrThrow({
    where: { id: projectId },
    select: { slug: true },
  });
  return { userId: session.userId, slug: project.slug };
}

/** True when the user typed anything into a credential field — i.e. they mean
 * to set new credentials rather than keep the stored ones. */
function credentialsTouched(provider: Provider, formData: FormData): boolean {
  const fields = provider === "JIRA" ? ["email", "apiToken"] : ["token"];
  return fields.some((f) => String(formData.get(f) ?? "").trim() !== "");
}

/** Read the provider-specific credentials out of the form. */
function readAuth(
  provider: Provider,
  formData: FormData
): { auth: IntegrationAuth } | { error: string } {
  if (provider === "JIRA") {
    const email = String(formData.get("email") ?? "").trim();
    const apiToken = String(formData.get("apiToken") ?? "").trim();
    if (!email || !apiToken)
      return { error: "Jira needs both an account email and an API token." };
    return { auth: { email, apiToken } };
  }
  const token = String(formData.get("token") ?? "").trim();
  if (!token) return { error: "An access token is required." };
  return { auth: { token } };
}

// https is required, because the credentials ride on every request. Self-hosted
// GitLab/Jira on a trusted private network (and the e2e mock) can opt out with
// TF_ALLOW_INSECURE_INTEGRATION_URL=1.
function readBaseUrl(provider: Provider, formData: FormData): string | null {
  const raw = String(formData.get("baseUrl") ?? "").trim() || defaultBaseUrl(provider);
  if (!raw) return null; // Jira without a site URL
  try {
    const u = new URL(raw);
    if (u.protocol === "https:") return raw.replace(/\/+$/, "");
    if (u.protocol === "http:" && process.env.TF_ALLOW_INSECURE_INTEGRATION_URL === "1")
      return raw.replace(/\/+$/, "");
    return null;
  } catch {
    return null;
  }
}

/**
 * Create or replace the project's integration for a provider. The connection is
 * verified against the live provider BEFORE anything is stored, so a bad token
 * can never be saved as active (AC 2).
 */
export async function saveIntegration(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId"));
  const admin = await requireIntegrationAdmin(projectId);
  if ("error" in admin) return admin;

  const provider = String(formData.get("provider")) as Provider;
  if (!PROVIDERS.includes(provider)) return { error: "Unknown provider." };

  const targetKey = String(formData.get("targetKey") ?? "").trim();
  if (!targetKey)
    return {
      error:
        provider === "JIRA"
          ? "Enter the Jira project key (e.g. QA)."
          : provider === "GITHUB"
            ? "Enter the repository as owner/repo."
            : "Enter the GitLab project path (e.g. group/project).",
    };

  const baseUrl = readBaseUrl(provider, formData);
  if (!baseUrl)
    return {
      error:
        provider === "JIRA"
          ? "Enter your Jira site URL (https://yourorg.atlassian.net)."
          : "Base URL must be a valid https URL (set TF_ALLOW_INSECURE_INTEGRATION_URL=1 for an internal http host).",
    };

  const existing = await db.integration.findUnique({
    where: { projectId_provider: { projectId, provider } },
  });

  // An edit may leave the credential fields entirely blank to keep the stored
  // ones. Touching any of them means "replace", so a half-filled Jira pair
  // must error rather than silently reuse the old token.
  let authEnc: string;
  let auth: IntegrationAuth;
  if (credentialsTouched(provider, formData) || !existing) {
    const submitted = readAuth(provider, formData);
    if ("error" in submitted) return submitted;
    auth = submitted.auth;
    authEnc = encrypt(JSON.stringify(auth));
  } else {
    auth = JSON.parse(decrypt(existing.authEnc)) as IntegrationAuth;
    authEnc = existing.authEnc;
  }

  try {
    await makeProvider(provider, baseUrl, targetKey, auth).testConnection();
  } catch (err) {
    return { error: `Connection failed: ${(err as Error).message}` };
  }

  await db.integration.upsert({
    where: { projectId_provider: { projectId, provider } },
    create: { projectId, provider, baseUrl, targetKey, authEnc, active: true },
    update: { baseUrl, targetKey, authEnc, active: true },
  });

  await logAudit({
    userId: admin.userId,
    action: existing ? "integration.update" : "integration.create",
    entityType: "project",
    entityId: projectId,
    detail: `${provider} → ${targetKey}`, // never the token
  });
  revalidatePath(`/projects/${admin.slug}/integrations`);
  return { ok: true };
}

/** Verify a saved integration still works. */
export async function testIntegration(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const id = String(formData.get("integrationId"));
  const integration = await db.integration.findUnique({ where: { id } });
  if (!integration) return { error: "Integration not found." };
  const admin = await requireIntegrationAdmin(integration.projectId);
  if ("error" in admin) return admin;

  try {
    await providerFor(integration).testConnection();
  } catch (err) {
    return { error: `Connection failed: ${(err as Error).message}` };
  }
  return { ok: true };
}

export async function toggleIntegration(formData: FormData): Promise<void> {
  const id = String(formData.get("integrationId"));
  const integration = await db.integration.findUnique({ where: { id } });
  if (!integration) return;
  const admin = await requireIntegrationAdmin(integration.projectId);
  if ("error" in admin) return;

  await db.integration.update({
    where: { id },
    data: { active: !integration.active },
  });
  await logAudit({
    userId: admin.userId,
    action: "integration.update",
    entityType: "project",
    entityId: integration.projectId,
    detail: `${integration.provider} → ${integration.active ? "inactive" : "active"}`,
  });
  revalidatePath(`/projects/${admin.slug}/integrations`);
}

export async function deleteIntegration(formData: FormData): Promise<void> {
  const id = String(formData.get("integrationId"));
  const integration = await db.integration.findUnique({ where: { id } });
  if (!integration) return;
  const admin = await requireIntegrationAdmin(integration.projectId);
  if ("error" in admin) return;

  // Issue links survive: they hold their own url/key and stay readable even
  // after the connection (and its credentials) are gone.
  await db.integration.delete({ where: { id } });
  await logAudit({
    userId: admin.userId,
    action: "integration.delete",
    entityType: "project",
    entityId: integration.projectId,
    detail: integration.provider,
  });
  revalidatePath(`/projects/${admin.slug}/integrations`);
}
