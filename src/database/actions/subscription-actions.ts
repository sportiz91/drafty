import { eq, inArray } from 'drizzle-orm';

import { db } from '@/database/database';
import {
  subscriptions,
  type NewSubscription,
  type Subscription,
} from '@/database/schema/subscriptions-schema';

/** Statuses that grant access to paid features. */
export const ENTITLED_STATUSES = ['active', 'trialing'];

export async function upsertSubscription(data: NewSubscription): Promise<void> {
  await db
    .insert(subscriptions)
    .values(data)
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        updatedAt: new Date(),
      },
    });
}

export async function updateSubscriptionByStripeId(
  stripeSubscriptionId: string,
  data: Pick<NewSubscription, 'status' | 'currentPeriodEnd'>
): Promise<void> {
  await db
    .update(subscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function getEntitledSubscriptionByUserId(
  userId: string
): Promise<Subscription | undefined> {
  return db.query.subscriptions.findFirst({
    where: (table, { and }) =>
      and(eq(table.userId, userId), inArray(table.status, ENTITLED_STATUSES)),
  });
}
