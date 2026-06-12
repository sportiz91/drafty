/** @jest-environment node */
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/route-auth';

function buildRequest(cookie?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/documents', {
    headers: cookie ? { cookie } : {},
  });
}

function signToken(payload: object, secret: string): string {
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

const TEST_SECRET = process.env.JWT_SECRET ?? '';

describe('requireAuth', () => {
  it('returns 401 when no access token cookie is present', () => {
    const result = requireAuth(buildRequest());

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 for a token signed with the wrong secret', () => {
    const forged = signToken(
      { userId: 'user-1', email: 'a@b.com' },
      'attacker-secret-attacker-secret-12345678'
    );

    const result = requireAuth(buildRequest(`accessToken=${forged}`));

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns 401 for an expired token', () => {
    const expired = jwt.sign(
      { userId: 'user-1', email: 'a@b.com' },
      TEST_SECRET,
      { expiresIn: '-1s' }
    );

    const result = requireAuth(buildRequest(`accessToken=${expired}`));

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it('returns the payload for a valid token', () => {
    const valid = signToken(
      { userId: 'user-1', email: 'santi@example.com' },
      TEST_SECRET
    );

    const result = requireAuth(buildRequest(`accessToken=${valid}`));

    expect(result).toEqual({ userId: 'user-1', email: 'santi@example.com' });
  });
});
