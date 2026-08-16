export interface PatternForDiff {
  title: string;
  patternType: string;
  confidence: "high" | "medium" | "low";
  sourceMaterialId: string | null;
  matchedMaterialId: string | null;
}

// Two patterns are "the same discovered pattern" across reports if they cite
// the same verified source/exam material pair. Without both ids (unverified
// citation), fall back to pattern type + title as a best-effort identity.
function patternKey(p: PatternForDiff): string {
  if (p.sourceMaterialId && p.matchedMaterialId) return `${p.sourceMaterialId}::${p.matchedMaterialId}`;
  return `${p.patternType}::${p.title.trim().toLowerCase()}`;
}

export function findNewHighConfidencePatterns<T extends PatternForDiff>(previous: T[], next: T[]): T[] {
  const previousKeys = new Set(previous.map(patternKey));
  return next.filter((p) => p.confidence === "high" && !previousKeys.has(patternKey(p)));
}
