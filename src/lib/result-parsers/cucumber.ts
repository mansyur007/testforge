import { ResultParseError, type NormalizedResults, type NormalizedTest } from "./types";

type CucumberStepResult = { status?: string; duration?: number; error_message?: string };
type CucumberStep = { name?: string; result?: CucumberStepResult };
type CucumberElement = {
  type?: string; // "scenario" | "background" | "scenario_outline" | ...
  name?: string;
  steps?: CucumberStep[];
};
type CucumberFeature = { name?: string; elements?: CucumberElement[] };

// Worst-first: an undefined step means no step definition matched (broken
// automation), so it's treated the same as a failure rather than a skip.
const SEVERITY: Record<string, number> = {
  failed: 3,
  ambiguous: 3,
  undefined: 3,
  pending: 2,
  skipped: 2,
  passed: 1,
};

function statusForSteps(steps: CucumberStep[]): { status: NormalizedTest["status"]; message?: string } {
  let worst = "passed";
  let message: string | undefined;
  for (const step of steps) {
    const s = (step.result?.status ?? "passed").toLowerCase();
    if ((SEVERITY[s] ?? 0) > (SEVERITY[worst] ?? 0)) {
      worst = s;
      message = step.result?.error_message;
    }
  }
  const status: NormalizedTest["status"] =
    worst === "passed" ? "PASSED" : worst === "failed" || worst === "ambiguous" || worst === "undefined" ? "FAILED" : "SKIPPED";
  return { status, message };
}

export function parseCucumber(json: string): NormalizedResults {
  let features: CucumberFeature[];
  try {
    const parsed: unknown = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error();
    features = parsed as CucumberFeature[];
  } catch {
    throw new ResultParseError("Invalid Cucumber JSON: expected an array of features");
  }

  const tests: NormalizedTest[] = [];
  for (const feature of features) {
    for (const el of feature.elements ?? []) {
      if (el.type === "background") continue;
      const steps = el.steps ?? [];
      const { status, message } = statusForSteps(steps);
      const timeSeconds = steps.reduce((sum, s) => sum + (s.result?.duration ?? 0), 0) / 1e9;
      tests.push({
        name: String(el.name ?? ""),
        classname: feature.name ? String(feature.name) : undefined,
        status,
        timeSeconds,
        message,
      });
    }
  }
  if (!tests.length)
    throw new ResultParseError("No scenarios found in the Cucumber JSON");

  return { tests };
}
