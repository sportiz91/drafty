import Stripe from 'stripe';

import { serverConfig } from '@/lib/config/config';

let client: Stripe | null = null;

/**
 * Lazy singleton — billing env vars are optional at boot so the app builds
 * and runs without Stripe configured; using billing without them fails with
 * an actionable message instead of a boot crash.
 */
export function getStripeClient(): Stripe {
  if (!serverConfig.stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set — see .env.example');
  }

  client ??= new Stripe(serverConfig.stripeSecretKey);

  return client;
}

export function constructWebhookEvent(
  rawBody: string,
  signature: string
): Stripe.Event {
  if (!serverConfig.stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set — see .env.example');
  }

  // Timing-safe HMAC verification over the RAW body.
  return getStripeClient().webhooks.constructEvent(
    rawBody,
    signature,
    serverConfig.stripeWebhookSecret
  );
}

type CheckoutParams = {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  origin: string;
};

export function createSubscriptionCheckoutSession(
  params: CheckoutParams
): Promise<Stripe.Checkout.Session> {
  if (!serverConfig.stripePriceId) {
    throw new Error('STRIPE_PRICE_ID is not set — see .env.example');
  }

  return getStripeClient().checkout.sessions.create({
    mode: 'subscription',
    // The bridge back to our user in the webhook — never trust client input.
    client_reference_id: params.userId,
    // Reuse the Stripe customer on repeat checkouts; otherwise prefill email.
    ...(params.stripeCustomerId
      ? { customer: params.stripeCustomerId }
      : { customer_email: params.userEmail }),
    // No payment_method_types — Stripe picks eligible methods dynamically.
    line_items: [{ price: serverConfig.stripePriceId, quantity: 1 }],
    success_url: `${params.origin}/documents?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/documents?checkout=cancelled`,
  });
}

export function createBillingPortalSession(
  stripeCustomerId: string,
  origin: string
): Promise<Stripe.BillingPortal.Session> {
  return getStripeClient().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}/documents`,
  });
}

export function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return getStripeClient().subscriptions.retrieve(subscriptionId);
}
