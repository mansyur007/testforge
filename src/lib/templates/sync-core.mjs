// F-47: upsert the built-in packs (src/content/templates) into CaseTemplate.
//
// Takes the Prisma client as an argument rather than importing it so this can
// run from `prisma/seed.mjs` (which builds its own client) and from the Next
// runtime (which uses the `src/lib/db.ts` singleton) without two copies. The
// TS wrapper is `src/lib/templates/sync.ts`.

import { createHash } from "node:crypto";
import { BUILT_IN_TEMPLATES } from "../../content/templates/index.mjs";
import { countTemplate, parseTemplateContent } from "./content-core.mjs";

/** Content identity, so a deploy that changed nothing does not bump `version`. */
function contentHash(contentJson) {
  return createHash("sha256").update(contentJson).digest("hex").slice(0, 16);
}

/**
 * Upsert every built-in pack by slug.
 *
 * Idempotent, and safe to call on every boot: rows are matched on `slug`, and
 * `version` is bumped only when the serialised content actually changed.
 *
 * What it deliberately does NOT write on an update is `published`. A superadmin
 * who unpublishes a pack has made a decision, and a deploy must not silently
 * reverse it — so the flag is set on create (published, so a fresh instance has
 * a usable library) and never touched again.
 *
 * @param {import("@prisma/client").PrismaClient} db
 * @returns {Promise<{created: number, updated: number, unchanged: number}>}
 */
export async function syncBuiltInTemplates(db) {
  const stats = { created: 0, updated: 0, unchanged: 0 };

  for (const pack of BUILT_IN_TEMPLATES) {
    // The packs are repo content, but they still go through the validator —
    // it is the only door content enters by, and a typo in a pack should fail
    // the build (via the selftest) rather than reach the apply engine.
    const parsed = parseTemplateContent(pack.content);
    if (!parsed.ok) {
      throw new Error(
        `Built-in template "${pack.slug}" is invalid:\n  ${parsed.errors.join("\n  ")}`,
      );
    }

    const contentJson = JSON.stringify(parsed.content);
    const { suites, cases } = countTemplate(parsed.content);
    const shared = {
      name: pack.name,
      summary: pack.summary ?? null,
      description: pack.description ?? null,
      category: pack.category ?? "GENERAL",
      order: pack.order ?? 0,
      contentJson,
      suiteCount: suites,
      caseCount: cases,
      builtIn: true,
    };

    const existing = await db.caseTemplate.findUnique({
      where: { slug: pack.slug },
      select: { id: true, contentJson: true, version: true },
    });

    if (!existing) {
      await db.caseTemplate.create({
        data: { ...shared, slug: pack.slug, published: true, version: 1 },
      });
      stats.created++;
      continue;
    }

    const changed = contentHash(existing.contentJson) !== contentHash(contentJson);
    await db.caseTemplate.update({
      where: { id: existing.id },
      // `published` is intentionally absent — see the note above.
      data: { ...shared, ...(changed ? { version: existing.version + 1 } : {}) },
    });
    if (changed) stats.updated++;
    else stats.unchanged++;
  }

  return stats;
}
