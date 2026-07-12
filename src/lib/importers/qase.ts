import { PRIORITIES } from "@/lib/constants";
import { ImportParseError, type ImportedCase, type ParsedImport } from "./types";

// F-22: Qase JSON export.
//
// Assumed shape (Qase's public API returns cases and suites as separate
// paginated resources; this is the flattened shape a user is expected to
// assemble/export before uploading here):
//
// {
//   "suites": [{ "id": 1, "title": "Auth", "parent_id": null }],
//   "cases": [
//     {
//       "id": 10,
//       "title": "Valid login",
//       "description": "...",
//       "preconditions": "...",
//       "suite_id": 1,
//       "priority": "high",             // low | medium | high | critical
//       "type": "functional",           // functional | smoke | regression | security | other
//       "severity": "major",            // fallback for priority when priority is absent
//       "tags": ["smoke", "auth"],
//       "steps": [{ "action": "...", "expected_result": "..." }]
//     }
//   ]
// }

const PRIORITY_MAP: Record<string, string> = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
  critical: "CRITICAL",
};
// Severity is a fallback signal only — used when `priority` is absent.
const SEVERITY_TO_PRIORITY: Record<string, string> = {
  trivial: "LOW",
  minor: "LOW",
  normal: "MEDIUM",
  major: "HIGH",
  critical: "CRITICAL",
  blocker: "CRITICAL",
};
const TYPE_MAP: Record<string, string> = {
  functional: "FUNCTIONAL",
  smoke: "SMOKE",
  regression: "REGRESSION",
  security: "SECURITY",
  performance: "PERFORMANCE",
  e2e: "E2E",
  other: "FUNCTIONAL",
};

type QaseSuite = { id: number | string; title: string; parent_id: number | string | null };
type QaseStep = { action?: unknown; expected_result?: unknown };
type QaseCase = {
  title?: unknown;
  description?: unknown;
  preconditions?: unknown;
  suite_id?: number | string | null;
  priority?: unknown;
  severity?: unknown;
  type?: unknown;
  tags?: unknown;
  steps?: QaseStep[];
};
type QaseDoc = { suites?: QaseSuite[]; cases?: QaseCase[] };

function buildSuitePath(
  suiteId: number | string | null | undefined,
  byId: Map<string, QaseSuite>
): string[] {
  const path: string[] = [];
  let cursor = suiteId != null ? byId.get(String(suiteId)) : undefined;
  let guard = 0;
  while (cursor && guard++ < 50) {
    path.unshift(cursor.title);
    cursor = cursor.parent_id != null ? byId.get(String(cursor.parent_id)) : undefined;
  }
  return path;
}

function mapPriority(c: QaseCase, warnings: string[]): string {
  const p = c.priority ? String(c.priority).trim().toLowerCase() : "";
  if (p) {
    const mapped = PRIORITY_MAP[p];
    if (mapped) return mapped;
    if ((PRIORITIES as readonly string[]).includes(p.toUpperCase())) return p.toUpperCase();
    warnings.push(`unknown priority "${c.priority}" — defaulted to MEDIUM`);
    return "MEDIUM";
  }
  const s = c.severity ? String(c.severity).trim().toLowerCase() : "";
  if (s && SEVERITY_TO_PRIORITY[s]) return SEVERITY_TO_PRIORITY[s];
  return "MEDIUM";
}

function mapType(raw: unknown, warnings: string[]): string {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "FUNCTIONAL";
  const mapped = TYPE_MAP[s];
  if (mapped) return mapped;
  warnings.push(`unknown type "${raw}" — defaulted to FUNCTIONAL`);
  return "FUNCTIONAL";
}

export function parseQaseJson(json: string): ParsedImport {
  let doc: QaseDoc;
  try {
    doc = JSON.parse(json) as QaseDoc;
  } catch {
    throw new ImportParseError("Invalid JSON");
  }
  if (!doc || !Array.isArray(doc.cases))
    throw new ImportParseError('Expected a top-level "cases" array');

  const suiteById = new Map((doc.suites ?? []).map((s) => [String(s.id), s]));
  const cases: ImportedCase[] = [];

  for (const c of doc.cases) {
    const title = String(c.title ?? "").trim();
    if (!title) continue;

    const warnings: string[] = [];
    cases.push({
      suitePath: buildSuitePath(c.suite_id, suiteById),
      title,
      description: c.description ? String(c.description).trim() : undefined,
      preconditions: c.preconditions ? String(c.preconditions).trim() : undefined,
      steps: (c.steps ?? []).map((s) => ({
        action: String(s.action ?? "").trim(),
        expected: String(s.expected_result ?? "").trim(),
      })),
      priority: mapPriority(c, warnings),
      type: mapType(c.type, warnings),
      tags: Array.isArray(c.tags) ? c.tags.map(String).join(",") : "",
      custom: {},
      warnings,
    });
  }

  if (!cases.length)
    throw new ImportParseError('No cases with a "title" found in the "cases" array');

  return { cases, toolWarnings: [] };
}
