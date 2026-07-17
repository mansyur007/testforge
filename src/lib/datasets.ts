// F-13: parameters/datasets — a case's stepsJson/title/etc. may contain
// {{var}} tokens; a dataset row supplies concrete values for one execution.
import { db } from "@/lib/db";

export type Dataset = { name: string; values: Record<string, string> };

const VAR_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export function parseDatasets(json: string | null | undefined): Dataset[] {
  if (!json) return [];
  try {
    const d = JSON.parse(json);
    if (!Array.isArray(d)) return [];
    return d.filter(
      (x): x is Dataset =>
        x && typeof x.name === "string" && typeof x.values === "object"
    );
  } catch {
    return [];
  }
}

/** Every distinct {{var}} name across the given text fields. */
export function extractVars(...texts: (string | null | undefined)[]): string[] {
  const found = new Set<string>();
  for (const t of texts) {
    if (!t) continue;
    Array.from(t.matchAll(VAR_RE)).forEach((m) => found.add(m[1]));
  }
  return Array.from(found);
}

/** {{var}} -> value; a missing/empty value renders as a visible ⚠{{var}} marker. */
export function substituteVars(
  text: string | null | undefined,
  values: Record<string, string>
): string {
  if (!text) return "";
  return text.replace(VAR_RE, (whole, name) =>
    values[name] ? values[name] : `⚠${whole}`
  );
}

/**
 * Given the case ids selected for a new run, returns one TestRunResult
 * create-row per case — or one per dataset row for cases that have
 * parameters, each stamped with its dataset name (F-13) and case revision
 * (F-05). A case with no datasets behaves exactly as before (datasetName null).
 */
export async function buildResultSeeds(
  caseIds: string[],
  // F-28: a run "from baseline" pins each result's caseRev to the baseline's
  // captured revision instead of the case's current rev.
  revOverride?: Map<string, number>
): Promise<{ caseId: string; caseRev?: number; datasetName?: string }[]> {
  if (!caseIds.length) return [];
  const cases = await db.testCase.findMany({
    where: { id: { in: caseIds } },
    select: { id: true, rev: true, datasetJson: true },
  });
  const byId = new Map(cases.map((c) => [c.id, c]));
  const seeds: { caseId: string; caseRev?: number; datasetName?: string }[] = [];
  for (const caseId of caseIds) {
    const c = byId.get(caseId);
    if (!c) continue;
    const rev = revOverride?.get(caseId) ?? c.rev;
    const datasets = parseDatasets(c.datasetJson);
    if (datasets.length === 0) {
      seeds.push({ caseId, caseRev: rev });
    } else {
      for (const d of datasets) {
        seeds.push({ caseId, caseRev: rev, datasetName: d.name });
      }
    }
  }
  return seeds;
}
