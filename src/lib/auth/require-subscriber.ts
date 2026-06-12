import { NextResponse } from 'next/server';

import * as subscriptionService from '@/services/subscription.service';
import type { AccessTokenPayload } from '@/types/auth.types';

/**
 * Entitlement guard (layer 2) for subscriber-only API routes. Always a DB
 * check — see subscription.service for why the JWT can't carry this.
 *
 * Usage (after requireAuth):
 * ```ts
 * const forbidden = await requireSubscriber(auth);
 * if (forbidden) return forbidden;
 * ```
 */
export async function requireSubscriber(
  auth: AccessTokenPayload
): Promise<NextResponse | null> {
  const isSubscriber = await subscriptionService.isActiveSubscriber(
    auth.userId
  );

  if (!isSubscriber) {
    return NextResponse.json(
      { error: 'Subscription required' },
      { status: 403 }
    );
  }

  return null;
}
