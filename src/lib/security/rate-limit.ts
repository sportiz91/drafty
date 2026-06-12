/**
 * In-memory sliding-window rate limiter. Correct for a single-instance
 * deployment (this assignment); a multi-instance deploy would need a
 * shared store (Redis) behind the same interface.
 */
import { NextResponse, type NextRequest } from 'next/server';

import { serverConfig } from '@/lib/config/config';

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  const timestamps = (hits.get(key) ?? []).filter(t => t > windowStart);

  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  hits.set(key, timestamps);

  return true;
}

/** First hop of x-forwarded-for, or a stable fallback for direct hits. */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  );
}

/**
 * Returns a 429 NextResponse when over the limit, null when allowed.
 *
 * Usage:
 * ```ts
 * const limited = enforceRateLimit(request, 'login', 5, 60_000);
 * if (limited) return limited;
 * ```
 */
export function enforceRateLimit(
  request: NextRequest,
  bucket: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  if (serverConfig.rateLimitDisabled) {
    return null;
  }

  const key = `${bucket}:${getClientIp(request)}`;

  if (rateLimit(key, limit, windowMs)) {
    return null;
  }

  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) },
    }
  );
}

/** Test-only: reset limiter state between tests. */
export function clearRateLimitState(): void {
  hits.clear();
}
