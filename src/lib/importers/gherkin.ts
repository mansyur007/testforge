import { ImportParseError, type ImportedCase, type ParsedImport } from "./types";

// F-27: Gherkin .feature file importer. One scenario (or scenario outline)
// = one case, stored as a raw `{gherkin: "..."}` step (see lib/steps.ts
// isGherkinCaseSteps) — never flattened into Given/When/Then rows. Feature-
// level and scenario-level tags both become the case's tags. Background is
// intentionally NOT merged into each scenario (documented simplification —
// it has no per-case home in TestForge's data model).

type RawScenario = { title: string; tags: string[]; bodyLines: string[] };

export function parseFeatureFile(text: string): ParsedImport {
  const lines = text.split(/\r\n|\r|\n/);
  let featureTitle = "";
  let featureTags: string[] = [];
  let pendingTags: string[] = [];
  let inBackground = false;
  const scenarios: RawScenario[] = [];
  let current: RawScenario | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.startsWith("@")) {
      pendingTags.push(
        ...line.split(/\s+/).filter((t) => t.startsWith("@")).map((t) => t.slice(1))
      );
      continue;
    }
    const featureMatch = /^Feature:\s*(.*)$/i.exec(line);
    if (featureMatch) {
      featureTitle = featureMatch[1].trim();
      featureTags = pendingTags;
      pendingTags = [];
      inBackground = false;
      current = null;
      continue;
    }
    if (/^Background:/i.test(line)) {
      inBackground = true;
      pendingTags = [];
      current = null;
      continue;
    }
    const scenarioMatch = /^Scenario(?: Outline)?:\s*(.*)$/i.exec(line);
    if (scenarioMatch) {
      inBackground = false;
      current = {
        title: scenarioMatch[1].trim() || "Untitled scenario",
        tags: [...featureTags, ...pendingTags],
        bodyLines: [],
      };
      scenarios.push(current);
      pendingTags = [];
      continue;
    }
    if (inBackground) continue; // Background steps are not attached to cases
    if (current) current.bodyLines.push(raw.replace(/\s+$/, ""));
  }

  if (!featureTitle) throw new ImportParseError('No "Feature:" line found');
  if (!scenarios.length) throw new ImportParseError('No "Scenario:" found under the feature');

  const cases: ImportedCase[] = scenarios.map((s) => {
    const body = s.bodyLines.join("\n").trim();
    return {
      suitePath: [featureTitle],
      title: s.title,
      steps: [{ gherkin: body }],
      priority: "MEDIUM",
      type: "FUNCTIONAL",
      tags: Array.from(new Set(s.tags)).join(","),
      custom: {},
      warnings: body ? [] : ["scenario has no steps"],
    };
  });

  return { cases, toolWarnings: [] };
}
