import * as documentActions from '@/database/actions/document-actions';
import type { Document } from '@/database/schema/documents-schema';
import { sanitizeDocumentHtml } from '@/lib/security/sanitize-document';
import type { UpdateDocumentInput } from '@/validators/document.validators';

/** Serializable shape for client components (dates as ISO strings). */
export type DocumentDto = {
  id: string;
  title: string;
  contentHtml: string;
  updatedAt: string;
};

export type DocumentListItemDto = {
  id: string;
  title: string;
  updatedAt: string;
};

export async function createDocument(userId: string): Promise<DocumentDto> {
  const document = await documentActions.createDocument({ userId });

  return toDto(document);
}

export async function listDocuments(
  userId: string
): Promise<DocumentListItemDto[]> {
  const rows = await documentActions.listDocumentsByUser(userId);

  return rows.map(row => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getDocument(
  id: string,
  userId: string
): Promise<DocumentDto | null> {
  const document = await documentActions.getDocumentForUser(id, userId);

  return document ? toDto(document) : null;
}

/**
 * Rename and/or save content. Content is sanitized HERE, at the trust
 * boundary — the DB never stores unsanitized markup.
 */
export async function updateDocument(
  id: string,
  userId: string,
  input: UpdateDocumentInput
): Promise<DocumentDto | null> {
  const data: Partial<Pick<Document, 'title' | 'contentHtml'>> = {};

  if (input.title !== undefined) {
    data.title = input.title;
  }

  if (input.contentHtml !== undefined) {
    data.contentHtml = sanitizeDocumentHtml(input.contentHtml);
  }

  const updated = await documentActions.updateDocumentForUser(id, userId, data);

  return updated ? toDto(updated) : null;
}

export async function deleteDocument(
  id: string,
  userId: string
): Promise<boolean> {
  return documentActions.deleteDocumentForUser(id, userId);
}

function toDto(document: Document): DocumentDto {
  return {
    id: document.id,
    title: document.title,
    contentHtml: document.contentHtml,
    updatedAt: document.updatedAt.toISOString(),
  };
}
