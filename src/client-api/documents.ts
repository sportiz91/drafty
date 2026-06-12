import { fetchWithRefresh } from '@/lib/api/fetch-with-refresh';
import type {
  DocumentDto,
  DocumentListItemDto,
} from '@/services/document.service';

type Result<T> = { success: true; data: T } | { success: false; error: string };

async function request<T>(
  path: string,
  init: RequestInit | undefined,
  pick: (body: unknown) => T | null
): Promise<Result<T>> {
  const response = await fetchWithRefresh(path, init);
  const body: unknown = await response.json().catch(() => null);

  if (response.ok) {
    const data = pick(body);

    if (data !== null) {
      return { success: true, data };
    }
  }

  const message =
    body !== null &&
    typeof body === 'object' &&
    'error' in body &&
    typeof body.error === 'string'
      ? body.error
      : 'Something went wrong. Please try again.';

  return { success: false, error: message };
}

function pickDocument(body: unknown): DocumentDto | null {
  if (body !== null && typeof body === 'object' && 'document' in body) {
    return body.document as DocumentDto;
  }

  return null;
}

export function createDocument(): Promise<Result<DocumentDto>> {
  return request('/api/v1/documents', { method: 'POST' }, pickDocument);
}

export function updateDocument(
  id: string,
  input: { title?: string; contentHtml?: string }
): Promise<Result<DocumentDto>> {
  return request(
    `/api/v1/documents/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    pickDocument
  );
}

export function deleteDocument(id: string): Promise<Result<boolean>> {
  return request(`/api/v1/documents/${id}`, { method: 'DELETE' }, body =>
    body !== null && typeof body === 'object' && 'success' in body ? true : null
  );
}

export type { DocumentDto, DocumentListItemDto };
