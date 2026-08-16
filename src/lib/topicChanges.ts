import type { TopicPriorityItem } from "@/lib/types";

export type PriorityLevel = "low" | "medium" | "high";

export function weightLevel(weight: number): PriorityLevel {
  if (weight >= 4) return "high";
  if (weight >= 3) return "medium";
  return "low";
}

export interface TopicChange {
  topic: string;
  fromLevel: PriorityLevel | "new";
  toLevel: PriorityLevel;
  reason: string;
}

// Only surfaces a change when a topic crosses a priority *bucket* (low/medium/high),
// not on every minor weight wobble — otherwise "what changed" becomes noise instead
// of signal.
export function diffTopicPriorities(previous: TopicPriorityItem[], next: TopicPriorityItem[]): TopicChange[] {
  const prevByTopic = new Map(previous.map((t) => [t.topic.toLowerCase(), t]));
  const changes: TopicChange[] = [];
  for (const item of next) {
    const prev = prevByTopic.get(item.topic.toLowerCase());
    const toLevel = weightLevel(item.weight);
    if (!prev) {
      changes.push({ topic: item.topic, fromLevel: "new", toLevel, reason: item.reason });
    } else {
      const fromLevel = weightLevel(prev.weight);
      if (fromLevel !== toLevel) {
        changes.push({ topic: item.topic, fromLevel, toLevel, reason: item.reason });
      }
    }
  }
  return changes;
}
