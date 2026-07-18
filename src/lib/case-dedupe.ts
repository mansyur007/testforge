// F-29 feature 3: near-duplicate case detection. The v1 detector is a local
// title trigram-similarity measure (Sørensen–Dice over character trigrams) —
// pure, deterministic, and needs NO API key, so it works even when AI assist
// is unconfigured. Embeddings are a future upgrade.

function trigrams(s: string): Set<string> {
  const norm = ` ${s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  const grams = new Set<string>();
  for (let i = 0; i < norm.length - 2; i++) grams.add(norm.slice(i, i + 3));
  return grams;
}

/** Sørensen–Dice coefficient over character trigrams: 0 (disjoint) … 1 (equal). */
export function titleSimilarity(a: string, b: string): number {
  const ga = trigrams(a);
  const gb = trigrams(b);
  if (ga.size === 0 || gb.size === 0) return 0;
  let inter = 0;
  ga.forEach((g) => {
    if (gb.has(g)) inter++;
  });
  return (2 * inter) / (ga.size + gb.size);
}

export type DuplicateMatch = { id: string; displayId: string; title: string; score: number };

/** Cases in `others` whose title is ≥ `threshold` similar to `title`, best first. */
export function findNearDuplicates(
  title: string,
  others: { id: string; displayId: string; title: string }[],
  threshold = 0.6
): DuplicateMatch[] {
  return others
    .map((o) => ({ ...o, score: titleSimilarity(title, o.title) }))
    .filter((o) => o.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
