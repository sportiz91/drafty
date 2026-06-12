import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LogoutButton } from '@/features/auth/components/logout-button';
import { ManageBillingButton } from '@/features/billing/components/manage-billing-button';
import { SubscribeButton } from '@/features/billing/components/subscribe-button';
import { getServerSession } from '@/lib/auth/server-session';
import * as subscriptionService from '@/services/subscription.service';

export const metadata: Metadata = { title: 'Documents' };

type DocumentsPageProps = {
  searchParams: Promise<{ checkout?: string }>;
};

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?redirect=/documents');
  }

  const [{ checkout }, isSubscriber] = await Promise.all([
    searchParams,
    subscriptionService.isActiveSubscriber(session.userId),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="flex items-center justify-between rounded-[var(--radius-panel)] bg-surface px-6 py-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink/90 text-sm font-semibold text-white">
            D
          </span>
          <span className="text-sm text-ink-secondary" data-id="user-email">
            {session.email}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isSubscriber ? <ManageBillingButton /> : null}
          <LogoutButton />
        </div>
      </header>

      {checkout === 'success' && !isSubscriber ? (
        <p
          className="mt-6 rounded-[var(--radius-button)] bg-surface px-5 py-4 text-sm text-ink-secondary shadow-[var(--shadow-card)]"
          data-id="checkout-processing"
        >
          Payment received — your workspace unlocks as soon as Stripe confirms
          it (usually instant). Refresh in a moment if you don&apos;t see it.
        </p>
      ) : null}
      {checkout === 'cancelled' ? (
        <p
          className="mt-6 rounded-[var(--radius-button)] bg-surface px-5 py-4 text-sm text-ink-secondary shadow-[var(--shadow-card)]"
          data-id="checkout-cancelled"
        >
          Checkout cancelled — you can subscribe whenever you&apos;re ready.
        </p>
      ) : null}

      {isSubscriber ? (
        <section
          className="mt-10 rounded-[var(--radius-card)] bg-surface p-10 text-center shadow-[var(--shadow-card)]"
          data-id="workspace"
        >
          <h1 className="text-[26px] font-medium tracking-[-0.02em]">
            Your documents
          </h1>
          <p className="mt-2 text-ink-secondary">
            You&apos;re on Drafty Pro — the editor lands here next.
          </p>
        </section>
      ) : (
        <section
          className="mx-auto mt-10 max-w-[428px] rounded-[var(--radius-card)] bg-surface p-8 text-center shadow-[var(--shadow-card)]"
          data-id="upgrade-card"
        >
          <span className="inline-block rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-secondary">
            Drafty Pro
          </span>
          <h1 className="mt-4 text-[26px] font-medium tracking-[-0.02em]">
            Unlock your workspace
          </h1>
          <p className="mt-2 text-ink-secondary">
            Documents are a Pro feature. Subscribe to create, edit and autosave
            rich text documents.
          </p>
          <div className="mt-6">
            <SubscribeButton />
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            Test mode — use card 4242 4242 4242 4242.
          </p>
        </section>
      )}
    </main>
  );
}
