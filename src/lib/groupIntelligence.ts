import type { GroupContributionDoc } from "@/lib/firestore/types";

export interface AggregatedTopic {
  topic: string;
  averageWeight: number;
  contributorCount: number;
}

export function aggregateTopicWeights(contributions: GroupContributionDoc[]): AggregatedTopic[] {
  const byTopic = new Map<string, { label: string; sum: number; count: number }>();

  for (const c of contributions) {
    for (const t of c.topicWeights) {
      const key = t.topic.trim().toLowerCase();
      if (!key) continue;
      const existing = byTopic.get(key) ?? { label: t.topic, sum: 0, count: 0 };
      existing.sum += t.weight;
      existing.count += 1;
      byTopic.set(key, existing);
    }
  }

  return [...byTopic.values()]
    .map((v) => ({ topic: v.label, averageWeight: Math.round((v.sum / v.count) * 10) / 10, contributorCount: v.count }))
    .sort((a, b) => b.averageWeight - a.averageWeight);
}
