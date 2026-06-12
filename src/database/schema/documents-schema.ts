import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { users } from '@/database/schema/users-schema';

export const documents = sqliteTable(
  'documents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull().default('Untitled'),
    /**
     * Sanitized HTML (sanitize-html allowlist applied on every write).
     * Tradeoff documented in the README: production would store TipTap
     * JSON and render through the schema; sanitized HTML keeps the
     * assignment surface small with the same XSS guarantees.
     */
    contentHtml: text('content_html').notNull().default(''),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => [index('documents_user_id_idx').on(table.userId)]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
