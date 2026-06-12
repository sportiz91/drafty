import { NextResponse } from 'next/server';

import { serverConfig } from '@/lib/config/config';
import type { AuthTokens } from '@/types/auth.types';

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export function setAuthCookies(
  response: NextResponse,
  tokens: AuthTokens
): void {
  const secure = serverConfig.cookieSecure;

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: tokens.expiresIn,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}
