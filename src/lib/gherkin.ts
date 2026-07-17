// F-27: BDD/Gherkin support shared between the case form/detail UI and the
// .feature import/export routes. A Gherkin case's stepsJson is exactly one
// `[{gherkin: "<raw scenario body>"}]` item (see lib/steps.ts isGherkinCaseSteps) —
// the whole "Given/When/Then" block is stored and rendered as one blob, not
// parsed into individual steps. Background is intentionally not merged into
// each scenario on import/export — it has no per-case home in this model.

export type GherkinLineType =
  | "feature"
  | "scenario"
  | "step"
  | "tag"
  | "comment"
  | "table"
  | "text";

export type GherkinToken = { type: GherkinLineType; keyword?: string; rest: string };

// Feature/Background/Scenario/Scenario Outline/Examples are followed by ":".
const HEADER_RE = /^(Feature|Background|Scenario Outline|Scenario|Examples):\s?(.*)$/;
// Given/When/Then/And/But are followed by a space, no colon.
const STEP_RE = /^(Given|When|Then|And|But)\s+(.*)$/;

/** Classify one line for syntax highlighting — used by GherkinBlock. */
export function tokenizeGherkinLine(line: string): GherkinToken {
  const trimmed = line.trim();
  if (!trimmed) return { type: "text", rest: "" };
  if (trimmed.startsWith("#")) return { type: "comment", rest: line };
  if (trimmed.startsWith("@")) return { type: "tag", rest: line };
  if (trimmed.startsWith("|")) return { type: "table", rest: line };

  const header = HEADER_RE.exec(trimmed);
  if (header) {
    const keyword = header[1];
    const type: GherkinLineType = keyword === "Feature" ? "feature" : "scenario";
    return { type, keyword, rest: header[2] };
  }
  const step = STEP_RE.exec(trimmed);
  if (step) return { type: "step", keyword: step[1], rest: step[2] };

  return { type: "text", rest: line };
}

/** Build a full .feature file from a set of Gherkin cases, one Feature block
 * per suite name (cases with no suite fall under `fallbackFeatureTitle`). */
export function serializeCasesToFeature(
  cases: { title: string; tags: string; gherkinBody: string; suiteName: string | null }[],
  fallbackFeatureTitle: string
): string {
  const bySuite = new Map<string, typeof cases>();
  for (const c of cases) {
    const key = c.suiteName ?? fallbackFeatureTitle;
    const list = bySuite.get(key) ?? [];
    list.push(c);
    bySuite.set(key, list);
  }

  const blocks: string[] = [];
  bySuite.forEach((group, featureTitle) => {
    const lines = [`Feature: ${featureTitle}`, ""];
    for (const c of group) {
      const tags = c.tags
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);
      if (tags.length) lines.push(`  ${tags.map((t: string) => `@${t}`).join(" ")}`);
      lines.push(`  Scenario: ${c.title}`);
      for (const bodyLine of c.gherkinBody.split("\n")) {
        lines.push(bodyLine ? `  ${bodyLine}` : "");
      }
      lines.push("");
    }
    blocks.push(lines.join("\n").trimEnd() + "\n");
  });
  return blocks.join("\n");
}
