import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/database/database';
import {
  documents,
  type Document,
  type NewDocument,
} from '@/database/schema/documents-schema';

/**
 * Every read/write is scoped by userId INSIDE the query (ownership is
 * layer 3 of the security model — never an if-check after fetching).
 */

export async function createDocument(data: NewDocument): Promise<Document> {
  const [document] = await db.insert(documents).values(data).returning();

  if (!document) {
    throw new Error('Failed to create document');
  }

  return document;
}

export async function listDocumentsByUser(
  userId: string
): Promise<Pick<Document, 'id' | 'title' | 'updatedAt'>[]> {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.updatedAt));
}

export async function getDocumentForUser(
  id: string,
  userId: string
): Promise<Document | undefined> {
  return db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.userId, userId)),
  });
}

export async function updateDocumentForUser(
  id: string,
  userId: string,
  data: Partial<Pick<Document, 'title' | 'contentHtml'>>
): Promise<Document | undefined> {
  const [updated] = await db
    .update(documents)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .returning();

  return updated;
}

export async function deleteDocumentForUser(
  id: string,
  userId: string
): Promise<boolean> {
  const deleted = await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.userId, userId)))
    .returning({ id: documents.id });

  return deleted.length > 0;
}
