"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { classFingerprint, getGroupSignal } from "@/lib/firestore/groupSignals";
import { aggregateTopicWeights, type AggregatedTopic } from "@/lib/groupIntelligence";
import { getUserProfile } from "@/lib/firestore/profile";
import type { ClassDoc } from "@/lib/firestore/types";

// Below 3 total contributors (you + at least 2 others), an average can be
// inverted to reveal the other contributor's exact value once you subtract
// your own — genuine anonymity only holds once there's more than one other
// person's number folded into the sum.
const MIN_CONTRIBUTORS = 3;

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export default function GroupIntelligencePanel({ cls }: { cls: ClassDoc }) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [optedIn, setOptedIn] = useState(false);
  const [contributorCount, setContributorCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [topics, setTopics] = useState<AggregatedTopic[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const profile = await getUserProfile(user.uid);
      const isOptedIn = profile?.shareGroupIntelligence === true;
      setOptedIn(isOptedIn);

      if (isOptedIn) {
        const fingerprint = classFingerprint(cls.teacherName, cls.subject, cls.grade);
        const result = await getGroupSignal(fingerprint);
        if (result) {
          setContributorCount(result.contributions.length);
          setTopics(aggregateTopicWeights(result.contributions));
          const mostRecent = result.contributions.map((c) => c.contributedAt).sort().at(-1);
          setLastUpdated(mostRecent ?? null);
        }
      }
      setLoaded(true);
    })();
  }, [user, cls.teacherName, cls.subject, cls.grade]);

  if (!loaded) return null;

  if (!optedIn) {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-medium">Group Intelligence</h2>
        <p className="mt-1 text-sm text-zinc-500">
          See how other students rank topic priority for this same teacher/subject/grade — and contribute your own signal.{" "}
          <Link href="/settings" className="underline">
            Turn it on in Settings
          </Link>
          .
        </p>
      </section>
    );
  }

  const ownWeights = new Map(cls.topicPriorities.map((t) => [t.topic.trim().toLowerCase(), t.weight]));
  const enoughContributors = contributorCount >= MIN_CONTRIBUTORS && topics.length > 0;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-medium">Group Intelligence</h2>
        {lastUpdated && <span className="shrink-0 text-xs text-zinc-400">updated {timeAgo(lastUpdated)}</span>}
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">
        Topic priority averaged across {contributorCount} student{contributorCount === 1 ? "" : "s"} matched to this teacher, subject, and grade.
      </p>

      {!enoughContributors ? (
        <p className="mt-3 text-sm text-zinc-500">
          {contributorCount === 0
            ? "No shared signal for this class yet — once you generate topic priorities, you'll be the first contributor."
            : `Needs at least ${MIN_CONTRIBUTORS} students sharing before an average is shown (currently ${contributorCount}) — with too few contributors, an average stops being anonymous.`}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {topics.map((t, i) => {
            const own = ownWeights.get(t.topic.trim().toLowerCase());
            const disagreement = own !== undefined && Math.abs(own - t.averageWeight) >= 2;
            return (
              <li key={i} className="flex items-center justify-between gap-3 rounded-md bg-zinc-50 px-2.5 py-1.5 dark:bg-zinc-950">
                <span className="text-zinc-800 dark:text-zinc-200">{t.topic}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs">
                  <span className="tabular-nums text-zinc-500">group {t.averageWeight}/5 ({t.contributorCount})</span>
                  {own !== undefined && (
                    <span className={`tabular-nums ${disagreement ? "font-medium text-amber-700 dark:text-amber-400" : "text-zinc-400"}`}>
                      you {own}/5
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-zinc-400 italic">
        Classes are matched by teacher name, subject, and grade across accounts — approximate, not verified to be the literal same class.
      </p>
    </section>
  );
}
