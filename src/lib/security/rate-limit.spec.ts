/** @jest-environment node */
import { clearRateLimitState, rateLimit } from '@/lib/security/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    clearRateLimitState();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allows requests under the limit', () => {
    expect(rateLimit('k', 3, 60_000)).toBe(true);
    expect(rateLimit('k', 3, 60_000)).toBe(true);
    expect(rateLimit('k', 3, 60_000)).toBe(true);
  });

  it('blocks the request that exceeds the limit', () => {
    rateLimit('k', 2, 60_000);
    rateLimit('k', 2, 60_000);

    expect(rateLimit('k', 2, 60_000)).toBe(false);
  });

  it('tracks keys independently', () => {
    rateLimit('a', 1, 60_000);

    expect(rateLimit('a', 1, 60_000)).toBe(false);
    expect(rateLimit('b', 1, 60_000)).toBe(true);
  });

  it('allows again once the window slides past old hits', () => {
    rateLimit('k', 1, 60_000);
    expect(rateLimit('k', 1, 60_000)).toBe(false);

    jest.advanceTimersByTime(60_001);

    expect(rateLimit('k', 1, 60_000)).toBe(true);
  });
});
