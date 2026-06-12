import { NextRequest, NextResponse } from 'next/server';

import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '@/lib/auth/auth-cookies';
import * as tokenService from '@/services/token.service';

/**
 * POST /api/v1/auth/refresh
 * Rotates the refresh token and issues a new token pair.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const tokens = await tokenService.rotateRefreshToken(refreshToken);

    const response = NextResponse.json({ expiresIn: tokens.expiresIn });
    setAuthCookies(response, tokens);

    return response;
  } catch {
    const response = NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
    clearAuthCookies(response);

    return response;
  }
}
