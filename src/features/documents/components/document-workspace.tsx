'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  deleteDocument,
  updateDocument,
  type DocumentDto,
} from '@/client-api/documents';
import { DocumentEditor } from '@/features/documents/components/document-editor';
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_LABELS: Record<SaveState, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed — retrying on next change',
};

type DocumentWorkspaceProps = {
  document: DocumentDto;
};

export function DocumentWorkspace({ document }: DocumentWorkspaceProps) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const persistContent = useDebouncedCallback(async (contentHtml: string) => {
    setSaveState('saving');
    const result = await updateDocument(document.id, { contentHtml });
    setSaveState(result.success ? 'saved' : 'error');
  }, 800);

  const persistTitle = useDebouncedCallback(async (nextTitle: string) => {
    if (!nextTitle.trim()) {
      return;
    }

    setSaveState('saving');
    const result = await updateDocument(document.id, {
      title: nextTitle.trim(),
    });
    setSaveState(result.success ? 'saved' : 'error');
    // Sidebar shows titles from server data — re-sync it.
    router.refresh();
  }, 600);

  function handleTitleChange(value: string) {
    setTitle(value);
    persistTitle(value);
  }

  async function handleDelete() {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      // Auto-cancel the armed state so a stray click can't delete later.
      setTimeout(() => setIsConfirmingDelete(false), 4000);
      return;
    }

    const result = await deleteDocument(document.id);

    if (result.success) {
      router.push('/documents');
      router.refresh();
    }
  }

  return (
    <section className="min-w-0 flex-1 rounded-[var(--radius-card)] bg-surface p-8 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <input
          value={title}
          onChange={event => handleTitleChange(event.target.value)}
          aria-label="Document title"
          data-id="document-title"
          className="w-full bg-transparent text-[26px] font-medium tracking-[-0.02em] focus:outline-none"
        />
        <div className="flex shrink-0 items-center gap-3">
          <span
            className="text-xs text-ink-muted"
            data-id="save-status"
            aria-live="polite"
          >
            {SAVE_LABELS[saveState]}
          </span>
          <button
            onClick={handleDelete}
            data-id="delete-document-button"
            className={`rounded-[var(--radius-button)] px-3 py-1.5 text-sm transition-colors ${
              isConfirmingDelete
                ? 'bg-accent text-white'
                : 'bg-surface-muted text-ink-secondary hover:bg-border'
            }`}
          >
            {isConfirmingDelete ? 'Confirm delete?' : 'Delete'}
          </button>
        </div>
      </div>
      <DocumentEditor
        initialContentHtml={document.contentHtml}
        onContentChange={persistContent}
      />
    </section>
  );
}
