import { z } from 'zod';

/** Matches the 1MB body cap on the autosave route — DB-level guard. */
const CONTENT_MAX_CHARS = 1_000_000;

export const updateDocumentSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    contentHtml: z.string().max(CONTENT_MAX_CHARS).optional(),
  })
  .refine(data => data.title !== undefined || data.contentHtml !== undefined, {
    message: 'Nothing to update',
  });

export const documentIdSchema = z.uuid();

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
