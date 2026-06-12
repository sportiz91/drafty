import type Stripe from 'stripe';

import * as subscriptionActions from '@/database/actions/subscription-actions';
import * as userActions from '@/database/actions/user-actions';
import * as stripeApi from '@/lib/stripe/stripe';

/**
 * Entitlement check — the DB row (written only by verified webhooks) is the
 * single source of truth. Never the JWT (it can outlive the subscription)
 * and never a client flag.
 */
export async function isActiveSubscriber(userId: string): Promise<boolean> {
  const subscription =
    await subscriptionActions.getEntitledSubscriptionByUserId(userId);

  if (!subscription) {
    return false;
  }

  // Safety net for missed renewal webhooks: a period end in the past means
  // the subscription is no longer paid, whatever the stale status says.
  if (
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() < Date.now()
  ) {
    return false;
  }

  return true;
}

/**
 * Fulfillment for checkout.session.completed. Re-fetches the subscription
 * from Stripe rather than trusting payload fields for the entitlement
 * decision.
 */
export async function processCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  if (session.mode !== 'subscription') {
    return;
  }

  const userId = session.client_reference_id;
  const subscriptionId = idFrom(session.subscription);
  const customerId = idFrom(session.customer);

  if (!userId || !subscriptionId || !customerId) {
    console.error('Webhook checkout session missing references', {
      sessionId: session.id,
    });
    return;
  }

  const subscription = await stripeApi.getSubscription(subscriptionId);

  await subscriptionActions.upsertSubscription({
    userId,
    stripeSubscriptionId: subscriptionId,
    stripeCustomerId: customerId,
    status: subscription.status,
    currentPeriodEnd: periodEndFrom(subscription),
  });
  await userActions.setStripeCustomerId(userId, customerId);
}

/** Keeps the local row in sync on renewals, cancellations, payment failures. */
export async function processSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  await subscriptionActions.updateSubscriptionByStripeId(subscription.id, {
    status: subscription.status,
    currentPeriodEnd: periodEndFrom(subscription),
  });
}

export async function processSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  await subscriptionActions.updateSubscriptionByStripeId(subscription.id, {
    status: 'canceled',
    currentPeriodEnd: periodEndFrom(subscription),
  });
}

/** Stripe references may arrive as ids or expanded objects. */
function idFrom(
  reference: string | { id: string } | null | undefined
): string | null {
  if (typeof reference === 'string') {
    return reference;
  }

  return reference?.id ?? null;
}

/** Since API 2025-03-31 the period end lives on the subscription item. */
function periodEndFrom(subscription: Stripe.Subscription): Date | null {
  const periodEnd = subscription.items.data[0]?.current_period_end;

  return periodEnd ? new Date(periodEnd * 1000) : null;
}
