import { NextRequest, NextResponse } from 'next/server';

import { ACCESS_TOKEN_COOKIE } from '@/lib/auth/auth-cookies';
import * as tokenService from '@/services/token.service';
import type { AccessTokenPayload } from '@/types/auth.types';

/**
 * Reads the accessToken cookie and verifies the JWT.
 * Returns the decoded payload or null if missing/invalid.
 */
export function getAuthPayload(
  request: NextRequest
): AccessTokenPayload | null {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  try {
    return tokenService.verifyAccessToken(accessToken);
  } catch {
    return null;
  }
}

/**
 * Requires a valid JWT. Returns the payload or a 401 NextResponse.
 *
 * Usage:
 * ```ts
 * const auth = requireAuth(request);
 * if (auth instanceof NextResponse) return auth;
 * // auth is AccessTokenPayload
 * ```
 */
export function requireAuth(
  request: NextRequest
): AccessTokenPayload | NextResponse {
  const payload = getAuthPayload(request);

  if (!payload) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return payload;
}
