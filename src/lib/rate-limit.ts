import "server-only";

/**
 * Fixed-window rate limiter.
 * - Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL/TOKEN are set (recommended on Vercel,
 *   where memory is not shared between serverless instances).
 * - Falls back to an in-process Map (fine for a single server / development).
 */
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

const memory = new Map<string, { count: number; resetAt: number }>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
}

async function upstash(key: string, windowSec: number): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result: number }[];
    return Number(data[0]?.result ?? 0);
  } catch {
    return null;
  }
}

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const fullKey = `rl:${key}`;
  const remote = await upstash(fullKey, windowSec);
  if (remote !== null) {
    return { ok: remote <= limit, remaining: Math.max(0, limit - remote), retryAfterSec: windowSec };
  }
  const now = Date.now();
  sweep(now);
  const entry = memory.get(fullKey);
  if (!entry || entry.resetAt <= now) {
    memory.set(fullKey, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSec: windowSec };
  }
  entry.count += 1;
  return {
    ok: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
  };
}
