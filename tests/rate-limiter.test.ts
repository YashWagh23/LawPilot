import { describe, it, expect, beforeEach, vi } from "vitest";

// --- Module-level mock for NextRequest ---
// We create a lightweight fake NextRequest that satisfies the rate limiter's
// header-reading interface without needing the full Next.js runtime.
function makeRequest(ip = "1.2.3.4", xForwardedFor?: string): import("next/server").NextRequest {
  const headers = new Headers();
  if (xForwardedFor) {
    headers.set("x-forwarded-for", xForwardedFor);
  } else {
    headers.set("x-real-ip", ip);
  }
  // Cast: we only need .headers for the rate limiter
  return { headers } as unknown as import("next/server").NextRequest;
}

// Reset the in-memory bucket store before each test to guarantee isolation.
beforeEach(() => {
  // The rate limiter stores buckets on globalThis to survive hot-reloads.
  // Clearing it here ensures each test starts with a clean slate.
  if (globalThis.__lawpilot_rate_limit_buckets__) {
    globalThis.__lawpilot_rate_limit_buckets__.clear();
  }
});

describe("checkRateLimit — sliding window rate limiter", () => {
  it("allows the first request", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    const req = makeRequest("10.0.0.1");
    const result = checkRateLimit(req, "test", 5, 60_000);
    expect(result.limited).toBe(false);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("allows requests up to the max limit", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    const req = makeRequest("10.0.0.2");
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(req, "test-limit", 5, 60_000);
      expect(result.limited).toBe(false);
    }
  });

  it("blocks the request that exceeds the max limit", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    const req = makeRequest("10.0.0.3");
    for (let i = 0; i < 5; i++) {
      checkRateLimit(req, "test-block", 5, 60_000);
    }
    const result = checkRateLimit(req, "test-block", 5, 60_000);
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("different route keys are namespaced independently", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    const req = makeRequest("10.0.0.4");
    // Max out the 'route-a' bucket
    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, "route-a", 3, 60_000);
    }
    const routeABlocked = checkRateLimit(req, "route-a", 3, 60_000);
    expect(routeABlocked.limited).toBe(true);

    // 'route-b' should be completely unaffected
    const routeBResult = checkRateLimit(req, "route-b", 3, 60_000);
    expect(routeBResult.limited).toBe(false);
  });

  it("different IPs are tracked independently", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    const reqA = makeRequest("10.0.0.5");
    const reqB = makeRequest("10.0.0.6");
    // Max out IP A
    for (let i = 0; i < 3; i++) {
      checkRateLimit(reqA, "test-ips", 3, 60_000);
    }
    const ipABlocked = checkRateLimit(reqA, "test-ips", 3, 60_000);
    expect(ipABlocked.limited).toBe(true);

    // IP B should be unaffected
    const ipBResult = checkRateLimit(reqB, "test-ips", 3, 60_000);
    expect(ipBResult.limited).toBe(false);
  });

  it("extracts IP from x-forwarded-for header (first entry only)", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    // x-forwarded-for can be a comma-separated list of IPs; the first is the client
    const req = makeRequest(undefined, "203.0.113.10, 10.0.0.1, 172.16.0.1");
    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, "xfwd-test", 3, 60_000);
    }
    const result = checkRateLimit(req, "xfwd-test", 3, 60_000);
    expect(result.limited).toBe(true);
  });

  it("windows expire correctly — old timestamps are evicted", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    const req = makeRequest("10.0.0.7");

    // Use vi.setSystemTime to simulate time passing
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    // Max out the window
    for (let i = 0; i < 3; i++) {
      checkRateLimit(req, "expire-test", 3, 1_000); // 1-second window
    }
    const blocked = checkRateLimit(req, "expire-test", 3, 1_000);
    expect(blocked.limited).toBe(true);

    // Advance time past the window — old timestamps should be evicted
    vi.setSystemTime(now + 1_100);
    const afterExpiry = checkRateLimit(req, "expire-test", 3, 1_000);
    expect(afterExpiry.limited).toBe(false);

    vi.useRealTimers();
  });

  it("returns retryAfterSeconds >= 1 when rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    const req = makeRequest("10.0.0.8");
    for (let i = 0; i < 2; i++) {
      checkRateLimit(req, "retry-test", 2, 60_000);
    }
    const result = checkRateLimit(req, "retry-test", 2, 60_000);
    expect(result.limited).toBe(true);
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("does not crash on malformed/empty request object", async () => {
    const { checkRateLimit } = await import("@/lib/safety/rateLimiter");
    // The limiter must never crash the route, even on a broken request shape
    const badReq = {} as unknown as import("next/server").NextRequest;
    expect(() => checkRateLimit(badReq, "safe-test", 5, 60_000)).not.toThrow();
    const result = checkRateLimit(badReq, "safe-test", 5, 60_000);
    expect(result.limited).toBe(false); // unknown IP is allowed through (graceful degradation)
  });
});
