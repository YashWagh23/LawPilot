import type { NextRequest } from "next/server";

/**
 * Lightweight in-memory sliding-window rate limiter for API routes.
 *
 * Architectural note: LawPilot has no database (zero-auth, local-first by design — see README).
 * On a serverless/multi-instance deployment (e.g. Vercel), this counter is per-instance, not
 * globally distributed, so a determined attacker spreading requests across cold-started instances
 * can exceed the nominal limit. It is still a real, useful defense-in-depth measure: it stops
 * naive scripted abuse and accidental request storms (e.g. a buggy client retry loop) from a
 * single warm instance from generating unbounded Gemini API cost or hammering document processing,
 * without requiring new infrastructure.
 */

declare global {
  var __lawpilot_rate_limit_buckets__: Map<string, number[]> | undefined;
}

const buckets: Map<string, number[]> =
  globalThis.__lawpilot_rate_limit_buckets__ || new Map<string, number[]>();
if (!globalThis.__lawpilot_rate_limit_buckets__) {
  globalThis.__lawpilot_rate_limit_buckets__ = buckets;
}

// Bounds memory usage in a long-lived warm instance: if this many distinct client keys have been
// seen, prune the oldest-looking entries before adding a new one.
const MAX_TRACKED_KEYS = 5000;

function getClientKey(request: NextRequest): string {
  // Defensive: never let a malformed/partial request object (e.g. in tests, or an unexpected
  // runtime shape) crash the route through the rate limiter itself.
  try {
    const forwardedFor = request.headers?.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : request.headers?.get("x-real-ip");
    return ip || "unknown";
  } catch {
    return "unknown";
  }
}

export interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
}

/**
 * Checks and records a request against a per-route, per-client sliding window.
 * `routeKey` namespaces the limit per endpoint (e.g. "situation", "compare").
 */
export function checkRateLimit(
  request: NextRequest,
  routeKey: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const key = `${routeKey}:${getClientKey(request)}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  if (buckets.size > MAX_TRACKED_KEYS && !buckets.has(key)) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey !== undefined) buckets.delete(oldestKey);
  }

  const timestamps = (buckets.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    const retryAfterMs = timestamps[0] + windowMs - now;
    buckets.set(key, timestamps);
    return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { limited: false, retryAfterSeconds: 0 };
}
