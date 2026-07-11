import { ResultParseError, type NormalizedResults, type NormalizedTest } from "./types";

type MochaErr = { message?: string; [k: string]: unknown };
type MochaTest = {
  title?: string;
  fullTitle?: string;
  duration?: number; // milliseconds
  err?: MochaErr;
};
type MochaDoc = {
  stats?: unknown;
  tests?: MochaTest[];
  pending?: MochaTest[];
  failures?: MochaTest[];
};

export function parseMocha(json: string): NormalizedResults {
  let doc: MochaDoc;
  try {
    doc = JSON.parse(json) as MochaDoc;
  } catch {
    throw new ResultParseError("Invalid Mocha JSON");
  }

  const pendingTitles = new Set((doc.pending ?? []).map((t) => t.fullTitle ?? t.title));

  // Some mocha versions include pending tests in `tests`, some only list them
  // under `pending` — merge both, keyed by fullTitle, to cover either shape.
  const byTitle = new Map<string, MochaTest>();
  for (const t of doc.tests ?? []) byTitle.set(t.fullTitle ?? t.title ?? "", t);
  for (const t of doc.pending ?? []) {
    const key = t.fullTitle ?? t.title ?? "";
    if (!byTitle.has(key)) byTitle.set(key, t);
  }

  if (!byTitle.size)
    throw new ResultParseError("No tests found in the Mocha JSON");

  const tests: NormalizedTest[] = Array.from(byTitle.values()).map((t) => {
    const title = t.fullTitle ?? t.title ?? "";
    const hasErr = !!t.err && Object.keys(t.err).length > 0;
    const status: NormalizedTest["status"] = hasErr
      ? "FAILED"
      : pendingTitles.has(title)
        ? "SKIPPED"
        : "PASSED";
    return {
      name: title,
      status,
      timeSeconds: (t.duration ?? 0) / 1000,
      message: t.err?.message,
    };
  });

  return { tests };
}
