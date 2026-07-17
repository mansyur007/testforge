import { db } from "@/lib/db";

// F-30: CSV import column mapping — lets a project's CSV export tool use
// whatever header names it wants ("Test Case Title" instead of "title");
// the mapping translates them onto the fixed target fields the importer
// understands, and can be saved per project for reuse.

export const CSV_TARGET_FIELDS = [
  "title",
  "description",
  "preconditions",
  "steps",
  "expected_result",
  "priority",
  "type",
  "tags",
  "estimate",
] as const;
export type CsvTargetField = (typeof CSV_TARGET_FIELDS)[number];

export type ColumnMapping = Record<string, string>; // targetField -> source CSV header (as typed, any case)

/**
 * Rewrite a Papa-parsed row (keyed by lowercased/trimmed headers) onto the
 * fixed target field names. A target with no mapping entry falls back to
 * reading its own name directly — an empty mapping is a no-op, so existing
 * CSVs that already use the expected headers keep working unchanged.
 */
export function applyColumnMapping<T extends Record<string, string>>(
  row: T,
  mapping: ColumnMapping
): Record<string, string> {
  const out: Record<string, string> = { ...row };
  for (const [target, sourceHeader] of Object.entries(mapping)) {
    if (!sourceHeader) continue;
    const key = sourceHeader.trim().toLowerCase();
    out[target] = row[key] ?? "";
  }
  return out;
}

export async function loadColumnMapping(projectId: string): Promise<ColumnMapping> {
  const row = await db.importColumnMapping.findUnique({ where: { projectId } });
  if (!row) return {};
  try {
    return JSON.parse(row.mappingJson) as ColumnMapping;
  } catch {
    return {};
  }
}

export async function saveColumnMapping(
  projectId: string,
  mapping: ColumnMapping
): Promise<void> {
  await db.importColumnMapping.upsert({
    where: { projectId },
    create: { projectId, mappingJson: JSON.stringify(mapping) },
    update: { mappingJson: JSON.stringify(mapping) },
  });
}
