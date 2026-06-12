/** @jest-environment node */
import type Stripe from 'stripe';

import * as subscriptionActions from '@/database/actions/subscription-actions';
import * as userActions from '@/database/actions/user-actions';
import * as stripeApi from '@/lib/stripe/stripe';
import * as subscriptionService from '@/services/subscription.service';

jest.mock('@/database/actions/subscription-actions');
jest.mock('@/database/actions/user-actions');
jest.mock('@/lib/stripe/stripe');

const mockedSubscriptionActions = jest.mocked(subscriptionActions);
const mockedUserActions = jest.mocked(userActions);
const mockedStripeApi = jest.mocked(stripeApi);

function buildDbSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-row-1',
    userId: 'user-1',
    stripeSubscriptionId: 'sub_123',
    stripeCustomerId: 'cus_123',
    status: 'active',
    currentPeriodEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildStripeSubscription(
  overrides: Record<string, unknown> = {}
): Stripe.Subscription {
  return {
    id: 'sub_123',
    status: 'active',
    items: { data: [{ current_period_end: 1_800_000_000 }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe('isActiveSubscriber', () => {
  it('is false without an entitled subscription row', async () => {
    mockedSubscriptionActions.getEntitledSubscriptionByUserId.mockResolvedValue(
      undefined
    );

    await expect(
      subscriptionService.isActiveSubscriber('user-1')
    ).resolves.toBe(false);
  });

  it('is true for an active subscription with a future period end', async () => {
    mockedSubscriptionActions.getEntitledSubscriptionByUserId.mockResolvedValue(
      buildDbSubscription({
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
      })
    );

    await expect(
      subscriptionService.isActiveSubscriber('user-1')
    ).resolves.toBe(true);
  });

  it('is false when the period end is in the past despite a stale status', async () => {
    mockedSubscriptionActions.getEntitledSubscriptionByUserId.mockResolvedValue(
      buildDbSubscription({
        currentPeriodEnd: new Date(Date.now() - 86_400_000),
      })
    );

    await expect(
      subscriptionService.isActiveSubscriber('user-1')
    ).resolves.toBe(false);
  });
});

describe('processCheckoutSessionCompleted', () => {
  function buildSession(
    overrides: Record<string, unknown> = {}
  ): Stripe.Checkout.Session {
    return {
      id: 'cs_123',
      mode: 'subscription',
      client_reference_id: 'user-1',
      subscription: 'sub_123',
      customer: 'cus_123',
      ...overrides,
    } as unknown as Stripe.Checkout.Session;
  }

  it('ignores non-subscription sessions', async () => {
    await subscriptionService.processCheckoutSessionCompleted(
      buildSession({ mode: 'payment' })
    );

    expect(mockedSubscriptionActions.upsertSubscription).not.toHaveBeenCalled();
  });

  it('ignores sessions without a user reference (and does not grant)', async () => {
    await subscriptionService.processCheckoutSessionCompleted(
      buildSession({ client_reference_id: null })
    );

    expect(mockedSubscriptionActions.upsertSubscription).not.toHaveBeenCalled();
  });

  it('re-fetches the subscription and persists entitlement + customer id', async () => {
    mockedStripeApi.getSubscription.mockResolvedValue(
      buildStripeSubscription()
    );

    await subscriptionService.processCheckoutSessionCompleted(buildSession());

    expect(mockedStripeApi.getSubscription).toHaveBeenCalledWith('sub_123');
    expect(mockedSubscriptionActions.upsertSubscription).toHaveBeenCalledWith({
      userId: 'user-1',
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'active',
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
    });
    expect(mockedUserActions.setStripeCustomerId).toHaveBeenCalledWith(
      'user-1',
      'cus_123'
    );
  });
});

describe('subscription lifecycle webhooks', () => {
  it('syncs status and period end on update', async () => {
    await subscriptionService.processSubscriptionUpdated(
      buildStripeSubscription({ status: 'past_due' })
    );

    expect(
      mockedSubscriptionActions.updateSubscriptionByStripeId
    ).toHaveBeenCalledWith('sub_123', {
      status: 'past_due',
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
    });
  });

  it('marks the row canceled on deletion', async () => {
    await subscriptionService.processSubscriptionDeleted(
      buildStripeSubscription({ status: 'canceled' })
    );

    expect(
      mockedSubscriptionActions.updateSubscriptionByStripeId
    ).toHaveBeenCalledWith('sub_123', {
      status: 'canceled',
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
    });
  });
});
