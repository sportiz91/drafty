'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createDocument } from '@/client-api/documents';
import { Button } from '@/components/ui/button';

export function NewDocumentButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);

    const result = await createDocument();

    if (!result.success) {
      setError(result.error);
      setIsCreating(false);
      return;
    }

    router.push(`/documents/${result.data.id}`);
    router.refresh();
  }

  return (
    <div>
      <Button
        onClick={handleCreate}
        disabled={isCreating}
        data-id="new-document-button"
        className="w-full px-4 py-2.5 text-sm"
      >
        {isCreating ? 'Creating…' : '+ New document'}
      </Button>
      {error ? (
        <p className="mt-2 text-xs text-accent" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
