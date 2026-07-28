import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text } from 'drizzle-orm/pg-core';

/**
 * ============================================================================
 * UCI REGISTRY — corpus `B` (CANONICAL SOURCE FOR THIS PROJECT)
 * ============================================================================
 *
 * A UCI (Unique Content Identifier) is the text primary key of every content
 * entity: `<corpus letter><entity letter><number>`, stored uppercase, never
 * containing a colon. See the cross-project spec for the full rationale; the
 * sibling corpora are `Q` (islam-octabyte-io/quran) and `H`
 * (islam-octabyte-io/hadees).
 *
 * `B` is CLAIMED by islam-octabyte-io/fatawa-books — the entire namespace.
 *
 *   BF  fatawa book   `books`        BF1        1..n, catalogue order
 *   BP  page          `pages`        BP10026    composite: book + printed page
 *   BT  toc entry     `toc_entries`  BT10001    composite: book + entry number
 *   BE  edition       (reserved, unused — `E` is reserved for editions in every
 *                      corpus by convention; do not hand it out)
 *
 * Free second letters: A B C D G H I J K L M N O Q R S U V W X Y Z (22 free).
 * `BB` is deliberately left open for a series/collection entity, should
 * multi-volume sets ever need grouping above the book.
 *
 * NO DATA-DRIVEN PREFIXES IN `B`. Every entity letter here is structural, so
 * the reserved-`STRUCTURAL_LETTERS` rule that hadees needs (its hadith prefix
 * is per-book data, making `HZ1` and `HB1` the same shape) does not apply. Any
 * future entity letter must stay structural, or that rule has to be introduced
 * before the letter is handed out.
 *
 * Every UCI is proven by a row-local CHECK equal to its formula, so the
 * database — not the seed — is the authority on identifier shape. Composite
 * UCIs derive from the FK column plus the row's own position column (the
 * `QT` approach), never a shape-only regex.
 *
 * UCIs FREEZE ON PUBLISH. Never renamed, never renumbered; growth is
 * append-only. Other schema files in this directory point back here.
 * ============================================================================
 */

/**
 * One row per source `data-collection/*.db` file (23 at first seed).
 *
 * `number` is the catalogue order and doubles as the browse order, so no
 * separate sort column exists — assign it with volume sets consecutive
 * (Ashaab-ul-Hadees 1-5 together). It is frozen once published, because it also
 * forms every `BF`/`BP`/`BT` UCI in the corpus.
 *
 * Deliberately narrow: the source `metadata` table also carries Publish Year,
 * Translator, Number of Pages, Volume and Introduction. Publish Year and Volume
 * are unusable as data (`2013ء`, `نومبر 2017`, `متفرق`, or empty in 10 of 23
 * books) and the rest aren't needed yet. Adding any of them later touches no
 * UCI, so it is a plain additive migration.
 *
 * Column names are spelled out explicitly so a `casing` mismatch between the
 * runtime `drizzle()` call and `drizzle.config.ts` cannot silently diverge.
 */
export const books = pgTable(
  'books',
  {
    /** `BF1` — see the registry docblock above. */
    uci: text('uci').primaryKey(),
    /** Catalogue order, 1-based. Drives the UCI, so frozen on publish. */
    number: integer('number').notNull().unique(),
    /** Human handle, e.g. `fataawa-islamia-jild-2`. Renameable; the UCI is not. */
    slug: text('slug').notNull().unique(),
    /** Source metadata `Book Name`, e.g. `فتاویٰ اسلامیہ (جلد دوم)`. */
    title: text('title').notNull(),
    /**
     * Source metadata `Writer`, verbatim. Free text on purpose: multi-author
     * books put several names in one string (Fataawa Islamia lists Ibn Baz,
     * Ibn Uthaymeen, Ibn Jibreen and the Saudi Permanent Committee), and one
     * scholar is spelled four different ways across the corpus. Browsing by
     * author needs a `scholars` table + join, backfilled from these strings.
     */
    writer: text('writer'),
    /** Source metadata `Publisher`, e.g. `دار السلام`. */
    publisher: text('publisher'),
  },
  (t) => [
    // The corpus is open-ended (more books will be added), so unlike Quran's
    // `BETWEEN 1 AND 114` there is no upper range check here.
    check('books_uci_check', sql`${t.uci} = 'BF' || ${t.number}`),
    check('books_number_check', sql`${t.number} > 0`),
  ],
);

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;
