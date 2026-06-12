import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { DocumentSidebar } from '@/features/documents/components/document-sidebar';
import { DocumentWorkspace } from '@/features/documents/components/document-workspace';
import { getServerSession } from '@/lib/auth/server-session';
import * as documentService from '@/services/document.service';
import * as subscriptionService from '@/services/subscription.service';
import { documentIdSchema } from '@/validators/document.validators';

type DocumentPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: DocumentPageProps): Promise<Metadata> {
  const session = await getServerSession();
  const { id } = await params;
  const parsed = documentIdSchema.safeParse(id);

  if (!session || !parsed.success) {
    return { title: 'Document' };
  }

  const document = await documentService.getDocument(
    parsed.data,
    session.userId
  );

  return { title: document?.title ?? 'Document' };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login?redirect=/documents');
  }

  const isSubscriber = await subscriptionService.isActiveSubscriber(
    session.userId
  );

  if (!isSubscriber) {
    redirect('/documents');
  }

  const { id } = await params;
  const parsed = documentIdSchema.safeParse(id);

  if (!parsed.success) {
    notFound();
  }

  const [document, documents] = await Promise.all([
    documentService.getDocument(parsed.data, session.userId),
    documentService.listDocuments(session.userId),
  ]);

  if (!document) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <DocumentSidebar documents={documents} activeId={document.id} />
      {/* key remounts the editor when navigating between documents */}
      <DocumentWorkspace key={document.id} document={document} />
    </div>
  );
}
