type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    pruneExpiredBuckets(now);
    return { allowed: true, limit, remaining: limit - 1, resetAt };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size < 500) return;

  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}
