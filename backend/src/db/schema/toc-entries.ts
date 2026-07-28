import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  unique,
} from 'drizzle-orm/pg-core';

import { books } from './books';
import { pages } from './pages';

/**
 * `BT` — table of contents (10,744 rows at first seed: 2,545 h1 + 8,199 h2).
 * UCI registry and corpus rules: see `./books.ts`.
 *
 * Source `tableOfContents` is a flat list with `headingType` of only `h1` or
 * `h2`; in these books `h1` is a chapter and `h2` is an individual fatwa title.
 * `number_in_book` is the source `ID`, which is reading order within the book,
 * so it doubles as the source id and no `source_id` column is needed.
 *
 * Composite UCI, same rule as `pages`:
 *
 *     BT10001  → book 1, entry 1
 *
 * Last 4 digits are the entry number, everything between `BT` and them is the
 * book number. Frozen ceiling of 9,999 entries per book (current max 2,067).
 */
export const tocEntries = pgTable(
  'toc_entries',
  {
    /** `BT10001` = book 1, entry 1. Derived from `bookUci` + `numberInBook`. */
    uci: text('uci').primaryKey(),
    bookUci: text('book_uci')
      .notNull()
      .references(() => books.uci),
    /** Source `tableOfContents.ID` — reading order within the book. */
    numberInBook: integer('number_in_book').notNull(),
    /** 1 or 2, from `headingType` `h1`/`h2`. 1 = chapter, 2 = fatwa title. */
    level: smallint('level').notNull(),
    /**
     * An `h2`'s parent `h1`; null for `h1` itself. Verified against all 23
     * source files: every book's first TOC entry is an `h1`, so every `h2` has
     * a resolvable parent — which is what lets the level/parent rule below be a
     * hard constraint instead of a convention. All 8,199 real `h2` rows load
     * clean under it.
     *
     * Same-book-ness is not enforceable row-locally (it would need a composite
     * FK); the ingest resolves the parent as the nearest preceding `h1` within
     * the same book, so it holds by construction.
     */
    parentUci: text('parent_uci').references((): AnyPgColumn => tocEntries.uci),
    /**
     * Heading text. Must be trimmed at ingest — every row in the source ends
     * with a trailing tab or space.
     */
    title: text('title').notNull(),
    /**
     * The page this entry points at (source `pageID`). Zero orphans across all
     * 23 files, so this is `notNull`.
     *
     * Because a `BP` UCI embeds the printed page number in its last 4 digits, a
     * TOC listing can render its citation straight off this column with no join.
     */
    pageUci: text('page_uci')
      .notNull()
      .references(() => pages.uci),
  },
  (t) => [
    check(
      'toc_entries_uci_check',
      sql`${t.uci} = 'BT' || substring(${t.bookUci} from 3) || lpad(${t.numberInBook}::text, 4, '0')`,
    ),
    // Upper bound closes the same `lpad` truncation hole documented on
    // `pages.pageNo`: entry 10000 would otherwise alias onto entry 1000.
    check(
      'toc_entries_number_in_book_check',
      sql`${t.numberInBook} BETWEEN 1 AND 9999`,
    ),
    check('toc_entries_level_check', sql`${t.level} IN (1, 2)`),
    // A chapter has no parent; a fatwa title always has one. Safe as a hard
    // constraint because every book starts with an `h1` (verified above).
    check(
      'toc_entries_parent_check',
      sql`(${t.level} = 1 AND ${t.parentUci} IS NULL)
       OR (${t.level} = 2 AND ${t.parentUci} IS NOT NULL)`,
    ),
    // Covers "TOC of book X" ordering as well as the idempotent-reseed lookup.
    unique('toc_entries_book_number_unique').on(t.bookUci, t.numberInBook),
    index('toc_entries_page_uci_idx').on(t.pageUci),
    index('toc_entries_parent_uci_idx').on(t.parentUci),
  ],
);

export type TocEntry = typeof tocEntries.$inferSelect;
export type NewTocEntry = typeof tocEntries.$inferInsert;
