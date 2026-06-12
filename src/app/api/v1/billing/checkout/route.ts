import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/route-auth';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import * as stripeApi from '@/lib/stripe/stripe';
import * as authService from '@/services/auth.service';

/**
 * POST /api/v1/billing/checkout
 * Creates a Stripe Checkout Session (subscription) for the current user.
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  const limited = enforceRateLimit(request, 'checkout', 5, 60_000);
  if (limited) {
    return limited;
  }

  try {
    const user = await authService.getAuthenticatedUserRecord(auth.userId);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await stripeApi.createSubscriptionCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      stripeCustomerId: user.stripeCustomerId,
      origin: request.nextUrl.origin,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to start checkout' },
      { status: 500 }
    );
  }
}
