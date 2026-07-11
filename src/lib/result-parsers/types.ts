// Normalized shape every format parser reduces to, so the ingestion pipeline
// (case matching, run creation) only has to be written once.
export type NormalizedStatus = "PASSED" | "FAILED" | "SKIPPED";

export type NormalizedTest = {
  name: string;
  classname?: string;
  status: NormalizedStatus;
  timeSeconds?: number;
  message?: string;
};

export type NormalizedResults = { tests: NormalizedTest[] };

export class ResultParseError extends Error {}

export function toArray<T>(x: T | T[] | undefined | null): T[] {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}
