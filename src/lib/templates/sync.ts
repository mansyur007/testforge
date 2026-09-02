import "server-only";
import { db } from "@/lib/db";
import { syncBuiltInTemplates as syncCore } from "./sync-core.mjs";

// F-47: keep the built-in library in step with `src/content/templates`.
//
// Production ships no seed script (docker runs `prisma db push` and starts), so
// the library cannot rely on `prisma/seed.mjs` having run. Instead the gallery
// calls `ensureBuiltInTemplates()` on its first render and the sync happens
// lazily, once per process.

const sync = syncCore as (
  client: typeof db,
) => Promise<{ created: number; updated: number; unchanged: number }>;

let done: Promise<void> | null = null;

/**
 * Sync the built-in packs, at most once per process.
 *
 * The promise is cached rather than a boolean flag so concurrent first
 * requests await one sync instead of racing several upserts on the same slugs.
 * A failure clears the cache so the next request retries — a transient DB error
 * on boot should not leave the gallery permanently empty.
 */
export function ensureBuiltInTemplates(): Promise<void> {
  if (!done) {
    done = sync(db)
      .then(() => undefined)
      .catch((err) => {
        done = null;
        // Deliberately not rethrown: a template library that failed to sync is
        // a degraded gallery, not a broken page. The gallery renders whatever
        // rows already exist.
        console.error("[templates] built-in sync failed:", err);
      });
  }
  return done;
}

export { sync as syncBuiltInTemplates };
