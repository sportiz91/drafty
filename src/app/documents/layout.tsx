import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { LogoutButton } from '@/features/auth/components/logout-button';
import { ManageBillingButton } from '@/features/billing/components/manage-billing-button';
import { getServerSession } from '@/lib/auth/server-session';
import * as subscriptionService from '@/services/subscription.service';

export default async function DocumentsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?redirect=/documents');
  }

  const isSubscriber = await subscriptionService.isActiveSubscriber(
    session.userId
  );

  return (
    <div className="mx-auto max-w-6xl p-6">
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
      <main className="mt-6">{children}</main>
    </div>
  );
}
