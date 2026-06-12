import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LogoutButton } from '@/features/auth/components/logout-button';
import { getServerSession } from '@/lib/auth/server-session';

export const metadata: Metadata = { title: 'Documents' };

export default async function DocumentsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?redirect=/documents');
  }

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
        <LogoutButton />
      </header>
      <section className="mt-10 rounded-[var(--radius-card)] bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <h1 className="text-[26px] font-medium tracking-[-0.02em]">
          Your documents
        </h1>
        <p className="mt-2 text-ink-secondary">
          The document workspace lands here next — subscribe to unlock it once
          billing ships.
        </p>
      </section>
    </main>
  );
}
