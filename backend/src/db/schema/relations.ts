import { relations } from 'drizzle-orm';

import { books } from './books';
import { pages } from './pages';
import { tocEntries } from './toc-entries';

/**
 * Relations live in their own file so no two schema files import each other —
 * `pages` already imports `books` for its FK, and adding the reverse side there
 * would make the cycle. Only `drizzle()`'s `{ schema }` (and therefore
 * `db.query.*`) consumes these; the tables themselves don't need them.
 *
 * UCI registry and corpus rules: see `./books.ts`.
 */

export const booksRelations = relations(books, ({ many }) => ({
  pages: many(pages),
  tocEntries: many(tocEntries),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  book: one(books, {
    fields: [pages.bookUci],
    references: [books.uci],
  }),
  /** TOC entries that point AT this page, not entries contained in it. */
  tocEntries: many(tocEntries),
}));

export const tocEntriesRelations = relations(tocEntries, ({ one, many }) => ({
  book: one(books, {
    fields: [tocEntries.bookUci],
    references: [books.uci],
  }),
  page: one(pages, {
    fields: [tocEntries.pageUci],
    references: [pages.uci],
  }),
  // Self-relation: `relationName` is what pairs these two halves. Without it
  // drizzle cannot tell which side of the h1/h2 hierarchy each one describes.
  parent: one(tocEntries, {
    fields: [tocEntries.parentUci],
    references: [tocEntries.uci],
    relationName: 'toc_entry_hierarchy',
  }),
  children: many(tocEntries, { relationName: 'toc_entry_hierarchy' }),
}));
