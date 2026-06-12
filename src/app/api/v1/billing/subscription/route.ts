import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/route-auth';
import * as subscriptionService from '@/services/subscription.service';

/**
 * GET /api/v1/billing/subscription
 * Returns the server-derived subscription state for the current user.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const isSubscriber = await subscriptionService.isActiveSubscriber(
    auth.userId
  );

  return NextResponse.json({ isSubscriber });
}
