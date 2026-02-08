export interface RateLimitConfig {
  requestsPerMinute?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const DEFAULT_REQUESTS_PER_MINUTE = 60;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute

export class RateLimiter {
  private readonly requestsPerMinute: number;
  private readonly windowMs: number;
  private readonly store: Map<string, RateLimitEntry>;

  constructor(config: RateLimitConfig = {}) {
    this.requestsPerMinute = config.requestsPerMinute ?? DEFAULT_REQUESTS_PER_MINUTE;
    this.windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
    this.store = new Map();
  }

  checkLimit(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // If no entry or window expired, start fresh
    if (!entry || now - entry.windowStart >= this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.requestsPerMinute - 1,
      };
    }

    // Window still active
    if (entry.count < this.requestsPerMinute) {
      entry.count++;
      return {
        allowed: true,
        remaining: this.requestsPerMinute - entry.count,
      };
    }

    // Limit exceeded
    const windowEnd = entry.windowStart + this.windowMs;
    const retryAfterMs = windowEnd - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }
}
