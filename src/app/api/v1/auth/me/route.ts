import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/route-auth';
import * as authService from '@/services/auth.service';

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const user = await authService.getAuthenticatedUser(auth.userId);

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
