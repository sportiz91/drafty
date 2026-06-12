import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SubscribeButton } from '@/features/billing/components/subscribe-button';
import { DocumentSidebar } from '@/features/documents/components/document-sidebar';
import { getServerSession } from '@/lib/auth/server-session';
import * as documentService from '@/services/document.service';
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

  if (!isSubscriber) {
    return (
      <>
        {checkout === 'success' ? (
          <p
            className="mb-6 rounded-[var(--radius-button)] bg-surface px-5 py-4 text-sm text-ink-secondary shadow-[var(--shadow-card)]"
            data-id="checkout-processing"
          >
            Payment received — your workspace unlocks as soon as Stripe confirms
            it (usually instant). Refresh in a moment if you don&apos;t see it.
          </p>
        ) : null}
        {checkout === 'cancelled' ? (
          <p
            className="mb-6 rounded-[var(--radius-button)] bg-surface px-5 py-4 text-sm text-ink-secondary shadow-[var(--shadow-card)]"
            data-id="checkout-cancelled"
          >
            Checkout cancelled — you can subscribe whenever you&apos;re ready.
          </p>
        ) : null}
        <section
          className="mx-auto max-w-[428px] rounded-[var(--radius-card)] bg-surface p-8 text-center shadow-[var(--shadow-card)]"
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
      </>
    );
  }

  const documents = await documentService.listDocuments(session.userId);

  return (
    <div className="flex gap-6" data-id="workspace">
      <DocumentSidebar documents={documents} />
      <section className="flex flex-1 items-center justify-center rounded-[var(--radius-card)] bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <div>
          <h1 className="text-[26px] font-medium tracking-[-0.02em]">
            {documents.length === 0
              ? 'Create your first document'
              : 'Select a document'}
          </h1>
          <p className="mt-2 text-ink-secondary" data-id="empty-state">
            {documents.length === 0
              ? 'Everything you write is autosaved and private to you.'
              : 'Pick one from the sidebar, or start something new.'}
          </p>
        </div>
      </section>
    </div>
  );
}
