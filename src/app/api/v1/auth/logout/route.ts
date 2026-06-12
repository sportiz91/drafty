import { NextRequest, NextResponse } from 'next/server';

import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
} from '@/lib/auth/auth-cookies';
import * as authService from '@/services/auth.service';

/**
 * POST /api/v1/auth/logout
 * Invalidates the refresh token and clears auth cookies.
 */
export async function POST(request: NextRequest) {
  await authService.logout(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value);

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);

  return response;
}
