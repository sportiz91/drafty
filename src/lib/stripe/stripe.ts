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

/**
 * The account's DEFAULT portal configuration lists every product in the
 * Stripe account for plan switches, so unrelated (test) products would
 * show up next to Drafty Pro. A dedicated configuration scopes the portal
 * to what Drafty supports — cancel, payment method, invoices; no plan
 * switching, there is a single plan — on any Stripe account.
 */
let portalConfigurationId: string | null = null;

async function getDraftyPortalConfigurationId(): Promise<string> {
  if (portalConfigurationId) {
    return portalConfigurationId;
  }

  const stripe = getStripeClient();
  const { data } = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  const existing = data.find(
    configuration => configuration.metadata?.app === 'drafty'
  );

  if (existing) {
    portalConfigurationId = existing.id;
    return existing.id;
  }

  const created = await stripe.billingPortal.configurations.create({
    business_profile: { headline: 'Drafty Pro' },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
    },
    metadata: { app: 'drafty' },
  });
  portalConfigurationId = created.id;

  return created.id;
}

export async function createBillingPortalSession(
  stripeCustomerId: string,
  origin: string
): Promise<Stripe.BillingPortal.Session> {
  const params: Stripe.BillingPortal.SessionCreateParams = {
    customer: stripeCustomerId,
    return_url: `${origin}/documents`,
  };

  try {
    params.configuration = await getDraftyPortalConfigurationId();
  } catch (error) {
    // A portal on the account's default configuration beats no portal.
    console.error('Falling back to the default portal configuration:', error);
  }

  return getStripeClient().billingPortal.sessions.create(params);
}

export function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return getStripeClient().subscriptions.retrieve(subscriptionId);
}
