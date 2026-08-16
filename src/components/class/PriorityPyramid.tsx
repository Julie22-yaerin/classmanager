import { TPS_TIERS, type TopicStateDoc, type TpsTier } from "@/lib/firestore/types";

// Narrowest band at the top (Critical — few topics, highest leverage) down
// to the widest at the bottom (Minimal — most topics, lowest leverage).
// Width is purely visual (fixed per tier, not scaled by count) so the shape
// always reads as a pyramid regardless of how lopsided the actual counts are.
const TIER_WIDTH: Record<TpsTier, string> = {
  Critical: "34%",
  High: "50%",
  Medium: "66%",
  Low: "82%",
  Minimal: "100%",
};

const TIER_FILL: Record<TpsTier, string> = {
  Critical: "bg-red-500/90 dark:bg-red-500/80",
  High: "bg-amber-400/90 dark:bg-amber-500/80",
  Medium: "bg-blue-400/90 dark:bg-blue-500/80",
  Low: "bg-zinc-300 dark:bg-zinc-600",
  Minimal: "bg-zinc-200 dark:bg-zinc-700",
};

const TIER_TEXT: Record<TpsTier, string> = {
  Critical: "text-white",
  High: "text-amber-950",
  Medium: "text-blue-950",
  Low: "text-zinc-700 dark:text-zinc-200",
  Minimal: "text-zinc-600 dark:text-zinc-300",
};

export default function PriorityPyramid({ states }: { states: TopicStateDoc[] }) {
  const byTier = new Map<TpsTier, TopicStateDoc[]>();
  for (const tier of TPS_TIERS) byTier.set(tier, []);
  for (const s of states) byTier.get(s.tpsTier)?.push(s);

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {TPS_TIERS.map((tier) => {
        const topics = byTier.get(tier) ?? [];
        const names = topics
          .slice(0, 2)
          .map((s) => s.topicLabel)
          .join(", ");
        return (
          <div
            key={tier}
            style={{ width: TIER_WIDTH[tier], clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0% 100%)" }}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 text-center ${TIER_FILL[tier]} ${TIER_TEXT[tier]}`}
          >
            <span className="text-xs font-semibold">
              {tier} · {topics.length}
            </span>
            {topics.length > 0 && (
              <span className="line-clamp-1 text-[10px] opacity-90">
                {names}
                {topics.length > 2 ? `, +${topics.length - 2} more` : ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
