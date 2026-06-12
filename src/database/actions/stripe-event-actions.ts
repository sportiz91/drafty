import { eq } from 'drizzle-orm';

import { db } from '@/database/database';
import { stripeEvents } from '@/database/schema/subscriptions-schema';

/**
 * Records a webhook event id. Returns false when the event was already
 * processed (Stripe retries deliveries) — the caller must then skip
 * fulfillment to stay idempotent.
 */
export async function markEventProcessed(
  id: string,
  type: string
): Promise<boolean> {
  const inserted = await db
    .insert(stripeEvents)
    .values({ id, type })
    .onConflictDoNothing()
    .returning({ id: stripeEvents.id });

  return inserted.length > 0;
}

/**
 * Removes the processed mark after a fulfillment failure, so Stripe's retry
 * of the same event is processed instead of skipped as a duplicate.
 */
export async function unmarkEvent(id: string): Promise<void> {
  await db.delete(stripeEvents).where(eq(stripeEvents.id, id));
}
