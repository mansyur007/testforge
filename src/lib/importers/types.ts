// F-22: shared intermediate shape every tool parser reduces to, so the
// committer (suite-by-path creation + chunked case creation) is written once.

export { toArray } from "@/lib/result-parsers/types";

export type ImportedStep = { action: string; expected: string };
// F-27: a Gherkin case stores its whole scenario body as one raw-text step,
// same shape TestCase.stepsJson uses ([{gherkin: "..."}]) — see lib/gherkin.ts.
export type ImportedGherkinStep = { gherkin: string };

export type ImportedCase = {
  suitePath: string[]; // e.g. ["Auth", "Login"] — [] = project root
  title: string;
  description?: string;
  preconditions?: string;
  expectedResult?: string;
  steps: ImportedStep[] | ImportedGherkinStep[];
  priority: string; // already mapped to a PRIORITIES value
  type: string; // already mapped to a CASE_TYPES value
  tags: string; // comma-separated
  custom: Record<string, string>; // source field label -> raw value, best-effort matched at commit time
  warnings: string[]; // per-case, e.g. "unknown priority '99' — defaulted to MEDIUM"
};

export type ParsedImport = {
  cases: ImportedCase[];
  toolWarnings: string[]; // parse-level, not tied to one case (e.g. "3 cases skipped: no title")
};

export class ImportParseError extends Error {}
