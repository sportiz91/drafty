import { NextRequest, NextResponse } from 'next/server';

import * as stripeEventActions from '@/database/actions/stripe-event-actions';
import * as stripeApi from '@/lib/stripe/stripe';
import * as subscriptionService from '@/services/subscription.service';

/**
 * POST /api/vendor/stripe/webhooks
 *
 * The ONLY writer of subscription entitlement. Signature-verified over the
 * raw body, idempotent by event id (Stripe retries deliveries).
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    // Raw body — request.json() would break the HMAC verification.
    event = stripeApi.constructWebhookEvent(await request.text(), signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const firstDelivery = await stripeEventActions.markEventProcessed(
    event.id,
    event.type
  );

  if (!firstDelivery) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await subscriptionService.processCheckoutSessionCompleted(
          event.data.object
        );
        break;
      case 'customer.subscription.updated':
        await subscriptionService.processSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await subscriptionService.processSubscriptionDeleted(event.data.object);
        break;
      default:
        // Not subscribed to anything else; acknowledge and move on.
        break;
    }
  } catch (error) {
    // Non-2xx makes Stripe retry — correct for transient fulfillment
    // failures (the processed-mark must not survive, or the retry would
    // be skipped as a duplicate).
    console.error(`Webhook fulfillment failed for ${event.type}:`, error);
    await stripeEventActions.unmarkEvent(event.id);
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
