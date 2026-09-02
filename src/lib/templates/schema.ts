import {
  COVERAGE_KINDS,
  LIMITS,
  TEMPLATE_CATEGORIES,
  coverageBreakdown as coverageBreakdownCore,
  countPruned as countPrunedCore,
  countTemplate as countTemplateCore,
  parseTemplateContent as parseTemplateContentCore,
  pruneToSelection as pruneToSelectionCore,
  selectAll as selectAllCore,
  substituteVariables as substituteVariablesCore,
  walkTemplate as walkTemplateCore,
} from "./content-core.mjs";

// F-47: the typed layer over `content-core.mjs`. The core is plain ESM so the
// selftest can run it under bare `node` (same split as `exam-core.mjs` /
// `exam.ts`); this file pins the shapes so consumers do not degrade to `any`.
//
// Not `server-only`: the preview screen renders a parsed tree in the browser,
// and nothing here reads a secret or touches the database.

export { COVERAGE_KINDS, LIMITS, TEMPLATE_CATEGORIES };

export type Coverage = (typeof COVERAGE_KINDS)[number];
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export type TemplateVariable = {
  /** Referenced as {{KEY}} in any text field. */
  key: string;
  label: string;
  default: string;
};

export type TemplateCase = {
  /** Stable id within the template — what the selection checkboxes send. */
  key: string;
  title: string;
  coverage: Coverage;
  priority: string;
  type: string;
  preconditions: string;
  steps: { action: string; expected: string }[];
  expectedResult: string;
  tags: string[];
  estimateSeconds?: number;
};

export type TemplateSuite = {
  key: string;
  name: string;
  description: string;
  cases: TemplateCase[];
  suites: TemplateSuite[];
};

export type TemplateContent = {
  variables: TemplateVariable[];
  suites: TemplateSuite[];
};

export type ParseResult =
  | { ok: true; content: TemplateContent }
  | { ok: false; errors: string[] };

/** Validate raw (already JSON.parse'd) content. The only door content enters by. */
export const parseTemplateContent = parseTemplateContentCore as (
  raw: unknown,
) => ParseResult;

export const countTemplate = countTemplateCore as (
  content: Pick<TemplateContent, "suites">,
) => { suites: number; cases: number };

export const coverageBreakdown = coverageBreakdownCore as (
  content: Pick<TemplateContent, "suites">,
) => Record<Coverage, number>;

export const walkTemplate = walkTemplateCore as (
  content: Pick<TemplateContent, "suites">,
  visit: (c: TemplateCase, path: TemplateSuite[]) => void,
) => void;

export const substituteVariables = substituteVariablesCore as (
  text: string,
  values: Record<string, string>,
) => string;

export type TemplateSelection = {
  suiteKeys: string[];
  caseKeys: string[];
};

/** A suite pruned to the selection; `cases` are the ones that survived. */
export type PrunedSuite = {
  source: TemplateSuite;
  cases: TemplateCase[];
  children: PrunedSuite[];
};

export const pruneToSelection = pruneToSelectionCore as (
  suites: TemplateSuite[],
  selection: TemplateSelection,
) => PrunedSuite[];

export const countPruned = countPrunedCore as (
  pruned: PrunedSuite[],
) => { suites: number; cases: number };

export const selectAll = selectAllCore as (
  content: Pick<TemplateContent, "suites">,
) => TemplateSelection;

/**
 * Parse a stored `CaseTemplate.contentJson`. A row can only have been written
 * through the validator, so a failure here means hand-edited data — degrade to
 * an empty tree rather than throwing on a read path.
 */
export function readStoredContent(contentJson: string): TemplateContent {
  try {
    const parsed = parseTemplateContent(JSON.parse(contentJson || "{}"));
    if (parsed.ok) return parsed.content;
  } catch {
    /* fall through */
  }
  return { variables: [], suites: [] };
}

/** The variable values to apply when the user leaves the form untouched. */
export function defaultVariableValues(
  content: TemplateContent,
): Record<string, string> {
  return Object.fromEntries(content.variables.map((v) => [v.key, v.default]));
}

/** Coverage tags are real case tags, so the taxonomy survives into the project. */
export function coverageTag(coverage: Coverage): string {
  return `coverage:${coverage}`;
}

/**
 * Why the apply screen defaults to DRAFT. A template is a starting point that
 * still needs adapting to the product under test, and F-15 treats ACTIVE as
 * runnable — thirty cases arriving runnable is a claim the team has not made.
 */
export const CASE_FORM_STATUS_HINT =
  "Draft keeps them out of runs until you have adapted them to your product.";

export const COVERAGE_LABELS: Record<Coverage, string> = {
  positive: "Positive",
  negative: "Negative",
  boundary: "Boundary",
  security: "Security",
  permission: "Permission",
  usability: "Usability",
  compatibility: "Compatibility",
};

export const COVERAGE_BADGES: Record<Coverage, string> = {
  positive: "bg-success-soft text-success-soft-fg",
  negative: "bg-danger-soft text-danger-soft-fg",
  boundary: "bg-warning-soft text-warning-soft-fg",
  security: "bg-accent-soft text-accent-soft-fg",
  permission: "bg-info-soft text-info-soft-fg",
  usability: "bg-surface-muted text-content-muted",
  compatibility: "bg-surface-muted text-content-muted",
};
