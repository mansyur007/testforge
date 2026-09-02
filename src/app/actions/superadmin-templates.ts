"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { requireSuperadmin } from "@/lib/superadmin";
import { countTemplate, parseTemplateContent } from "@/lib/templates/schema";
import { TEMPLATE_CATEGORIES } from "@/lib/templates/content-core.mjs";

// F-47: the first write path into the instance console, which until now was
// strictly read-only (src/lib/superadmin.ts). Three consequences, all load-
// bearing:
//
//   1. Every action below calls requireSuperadmin() FIRST. It 404s when the
//      console is dormant and redirects to its login when signed out, so a
//      mutation is unreachable in exactly the cases the read pages are.
//   2. Content only ever enters through parseTemplateContent. A superadmin
//      cannot store a blob that breaks the apply engine for every project on
//      the instance — the validator is the same one the built-in packs pass.
//   3. Every mutation is audited under `instance.*`, matching the login
//      actions, so the operator's writes are as traceable as their sign-ins.

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,60}$/;

type Result = { error?: string };

// Tagged rather than discriminated on `error`, because `Result.error` is
// optional and `"error" in x` cannot narrow an optional property.
type ReadContent =
  | { ok: true; contentJson: string; suites: number; cases: number }
  | { ok: false; error: string };

/** Parse the pasted JSON and normalise it, or return a user-facing error. */
function readContent(raw: string): ReadContent {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (e) {
    return { ok: false, error: `That is not valid JSON: ${(e as Error).message}` };
  }
  const result = parseTemplateContent(parsedJson);
  if (!result.ok) {
    // Every error at once — a paste-and-fix loop that surfaces one problem per
    // attempt is the reason people give up on import screens.
    return { ok: false, error: result.errors.join("\n") };
  }
  const { suites, cases } = countTemplate(result.content);
  return { ok: true, contentJson: JSON.stringify(result.content), suites, cases };
}

export async function createTemplateFromJson(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  await requireSuperadmin();

  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "GENERAL");

  if (!SLUG_RE.test(slug)) {
    return { error: "Slug must be lowercase letters, digits and hyphens (2–61 characters)." };
  }
  if (!name) return { error: "Name is required." };
  if (!(TEMPLATE_CATEGORIES as string[]).includes(category)) {
    return { error: "Unknown category." };
  }

  const taken = await db.caseTemplate.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (taken) return { error: `A template with the slug "${slug}" already exists.` };

  const content = readContent(String(formData.get("contentJson") ?? ""));
  if (!content.ok) return { error: content.error };

  const created = await db.caseTemplate.create({
    data: {
      slug,
      name,
      summary: summary || null,
      description: description || null,
      category,
      contentJson: content.contentJson,
      suiteCount: content.suites,
      caseCount: content.cases,
      // Drafts by default: a template published the instant it is pasted has
      // never been looked at in the preview every user will see.
      published: false,
      builtIn: false,
      version: 1,
    },
    select: { id: true, slug: true },
  });

  await logAudit({
    action: "instance.template.create",
    entityType: "TEMPLATE",
    entityId: created.id,
    detail: `${slug} (${content.suites} suites, ${content.cases} cases)`,
  });

  revalidatePath("/superadmin/templates");
  redirect(`/superadmin/templates/${created.slug}`);
}

export async function updateTemplate(
  _prev: Result | undefined,
  formData: FormData,
): Promise<Result> {
  await requireSuperadmin();

  const slug = String(formData.get("slug") ?? "");
  const existing = await db.caseTemplate.findUnique({ where: { slug } });
  if (!existing) return { error: "Template not found." };

  const name = String(formData.get("name") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? existing.category);
  if (!name) return { error: "Name is required." };
  if (!(TEMPLATE_CATEGORIES as string[]).includes(category)) {
    return { error: "Unknown category." };
  }

  const content = readContent(String(formData.get("contentJson") ?? ""));
  if (!content.ok) return { error: content.error };

  const changed = content.contentJson !== existing.contentJson;

  await db.caseTemplate.update({
    where: { slug },
    data: {
      name,
      summary: summary || null,
      description: description || null,
      category,
      contentJson: content.contentJson,
      suiteCount: content.suites,
      caseCount: content.cases,
      ...(changed ? { version: existing.version + 1 } : {}),
    },
  });

  await logAudit({
    action: "instance.template.update",
    entityType: "TEMPLATE",
    entityId: existing.id,
    // Says whether the tree moved, since that is what bumps the version every
    // project's "applied at version N" record is compared against.
    detail: `${slug}${changed ? ` → v${existing.version + 1}` : " (metadata only)"}`,
  });

  revalidatePath("/superadmin/templates");
  revalidatePath(`/superadmin/templates/${slug}`);
  // A built-in whose content was edited here is overwritten by the next
  // syncBuiltInTemplates() run, which is deliberate: the repo owns those.
  return {};
}

export async function setTemplatePublished(formData: FormData): Promise<void> {
  await requireSuperadmin();

  const slug = String(formData.get("slug") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  const t = await db.caseTemplate.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!t) return;

  await db.caseTemplate.update({ where: { slug }, data: { published } });
  await logAudit({
    action: published ? "instance.template.publish" : "instance.template.unpublish",
    entityType: "TEMPLATE",
    entityId: t.id,
    detail: slug,
  });

  revalidatePath("/superadmin/templates");
  revalidatePath(`/superadmin/templates/${slug}`);
}

export async function deleteTemplate(formData: FormData): Promise<void> {
  await requireSuperadmin();

  const slug = String(formData.get("slug") ?? "");
  const t = await db.caseTemplate.findUnique({
    where: { slug },
    select: { id: true, builtIn: true },
  });
  if (!t) return;

  // A built-in is repo content; deleting the row only makes the next deploy
  // recreate it, which reads as the delete having silently failed. Unpublish
  // is the honest way to take one out of circulation.
  if (t.builtIn) return;

  await db.caseTemplate.delete({ where: { slug } });
  await logAudit({
    action: "instance.template.delete",
    entityType: "TEMPLATE",
    entityId: t.id,
    detail: slug,
  });

  revalidatePath("/superadmin/templates");
  redirect("/superadmin/templates");
}
