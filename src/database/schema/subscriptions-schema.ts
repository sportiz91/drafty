import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { users } from '@/database/schema/users-schema';

/**
 * One row per Stripe subscription. Entitlement is always derived from this
 * table (DB is the source of truth, written only by verified webhooks) —
 * never from the JWT or any client-provided flag.
 */
export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
    stripeCustomerId: text('stripe_customer_id').notNull(),
    /** Raw Stripe status: active, trialing, past_due, canceled, unpaid… */
    status: text('status').notNull(),
    currentPeriodEnd: integer('current_period_end', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [index('subscriptions_user_id_idx').on(table.userId)]
);

/**
 * Processed webhook event ids — Stripe retries deliveries, fulfillment must
 * be idempotent. Insert is attempted first; a conflict means "already
 * processed, skip".
 */
export const stripeEvents = sqliteTable('stripe_events', {
  id: text('id').primaryKey(), // Stripe event id (evt_...)
  type: text('type').notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
