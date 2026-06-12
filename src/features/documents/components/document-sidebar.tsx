import Link from 'next/link';

import { NewDocumentButton } from '@/features/documents/components/new-document-button';
import type { DocumentListItemDto } from '@/services/document.service';

type DocumentSidebarProps = {
  documents: DocumentListItemDto[];
  activeId?: string;
};

export function DocumentSidebar({ documents, activeId }: DocumentSidebarProps) {
  return (
    <aside
      className="w-64 shrink-0 rounded-[var(--radius-panel)] bg-surface p-4 shadow-[var(--shadow-card)]"
      data-id="document-sidebar"
    >
      <NewDocumentButton />
      <nav className="mt-4 space-y-1">
        {documents.length === 0 ? (
          <p className="px-2 py-4 text-sm text-ink-muted" data-id="empty-list">
            No documents yet.
          </p>
        ) : (
          documents.map(document => (
            <Link
              key={document.id}
              href={`/documents/${document.id}`}
              className={`block rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface-muted ${
                document.id === activeId
                  ? 'bg-surface-muted font-medium'
                  : 'text-ink-secondary'
              }`}
              data-id="document-link"
            >
              <span className="block truncate">{document.title}</span>
              <span className="block text-xs text-ink-muted">
                {formatUpdatedAt(document.updatedAt)}
              </span>
            </Link>
          ))
        )}
      </nav>
    </aside>
  );
}

/** Fixed locale + UTC — keeps server and client renders identical. */
function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(iso));
}
