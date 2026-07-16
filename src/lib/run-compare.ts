// L-02 (extracted from runs/compare/page.tsx, zero behavior change): the
// single definition of what a "regression" is, shared by the compare page
// and the quality-gate evaluator so a CI verdict can never disagree with
// what the UI shows. Pure helper — client-safe, no db import.
//
// Delta semantics are kind-based (F-14): regression = PASS kind in A but
// FAIL/BLOCKED kind in B; fixed = the reverse.

export type Delta =
  | "REGRESSION"
  | "FIXED"
  | "CHANGED"
  | "ONLY_A"
  | "ONLY_B"
  | "SAME";

export function deltaOf(
  sa: string | null,
  sb: string | null,
  kindOf: (key: string) => string
): Delta {
  if (sa == null) return "ONLY_B";
  if (sb == null) return "ONLY_A";
  if (sa === sb) return "SAME";
  const failish = (k: string) => k === "FAIL" || k === "BLOCKED";
  if (kindOf(sa) === "PASS" && failish(kindOf(sb))) return "REGRESSION";
  if (failish(kindOf(sa)) && kindOf(sb) === "PASS") return "FIXED";
  return "CHANGED";
}
