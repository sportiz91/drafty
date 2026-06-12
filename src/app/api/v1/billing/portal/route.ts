import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/route-auth';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import * as stripeApi from '@/lib/stripe/stripe';
import * as authService from '@/services/auth.service';

/**
 * POST /api/v1/billing/portal
 * Opens the Stripe Customer Portal for subscription self-management.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = enforceRateLimit(request, 'portal', 5, 60_000);
  if (limited) {
    return limited;
  }

  try {
    const user = await authService.getAuthenticatedUserRecord(auth.userId);

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing profile yet' },
        { status: 400 }
      );
    }

    const session = await stripeApi.createBillingPortalSession(
      user.stripeCustomerId,
      request.nextUrl.origin
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Failed to open billing portal' },
      { status: 500 }
    );
  }
}
