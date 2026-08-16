/**
 * In-memory per-uid rate limiting for the AI-compute endpoints. This is a
 * single-process limiter — good enough for one Railway instance, not a
 * substitute for a shared store if this ever runs multi-instance. Its job
 * is to cap runaway/abusive usage against the app's shared OpenRouter
 * credit, not to be a precise quota system.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 60_000;
const LIMITS: Record<string, number> = {
  chat: 20,
  "exam-mode": 5,
  "teacher-playbook": 5,
  "teacher-simulator": 5,
  "pattern-finder": 5,
  "curriculum-graph": 5,
  "daily-mode": 10,
  "identify-class": 20,
};

const buckets = new Map<string, Bucket>();
const PRUNE_AFTER_MS = 10 * WINDOW_MS;
let lastPrune = Date.now();

function pruneStaleBuckets(now: number) {
  if (now - lastPrune < PRUNE_AFTER_MS) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > PRUNE_AFTER_MS) buckets.delete(key);
  }
}

export function checkRateLimit(uid: string, route: string): { allowed: boolean; remaining: number } {
  const limit = LIMITS[route] ?? 10;
  const key = `${uid}:${route}`;
  const now = Date.now();
  pruneStaleBuckets(now);
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}
