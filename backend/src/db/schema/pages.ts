import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';

import { books } from './books';

/**
 * `BP` — the book itself, one row per printed page (12,471 rows at first seed).
 * UCI registry and corpus rules: see `./books.ts`.
 *
 * `page_no` is the source `Book.ID`, which is the REAL PRINTED PAGE NUMBER — it
 * is not 1-based (books start at 21, 31, 5) and must never be renumbered, since
 * it is both the citation and half of the UCI. It doubles as the source id, so
 * no separate `source_id` column is needed and re-seeding stays idempotent on
 * the unique below.
 *
 * The UCI is composite rather than a global sequence:
 *
 *     BP10026   → book 1,  page 26
 *     BP232029  → book 23, page 2029
 *
 * Parse right-to-left: the LAST 4 DIGITS are always the page, everything
 * between `BP` and them is the book number. The least significant field is
 * padded and the most significant grows, so book 100 still works. Fixed width
 * 4 is a frozen ceiling of 9,999 pages per book (current max is 2,029, in
 * `ijtimaee-nizam`).
 *
 * Composite — not global — because a page is cited as "vol. 2, p. 26", never as
 * "page 4,193 of the corpus", and because a global sequence could not stay in
 * reading order once book 24 is appended (UCIs freeze, so renumbering is not
 * available).
 */
export const pages = pgTable(
  'pages',
  {
    /** `BP10026` = book 1, page 26. Derived from `bookUci` + `pageNo`. */
    uci: text('uci').primaryKey(),
    bookUci: text('book_uci')
      .notNull()
      .references(() => books.uci),
    /** Source `Book.ID` = printed page number. Not 1-based. */
    pageNo: integer('page_no').notNull(),
    /**
     * Source `Book.txt` with the presentation classes rewritten to the short
     * form below. Full meanings are documented once in the stylesheet; nothing
     * but CSS ever reads these, so they are stored short.
     *
     *   mu → lu (urdu)        ma → la (arabic)
     *   mb1 → b (bold)        mi1 → i (italic)    mul1 → u (underline)
     *   mc1 → hl (highlight)  mfnote → fn (footnote marker, e.g. `[1]`)
     *   mal0/1/2/3 → tr / tc / tj / tl   (align right/center/justify/left)
     *   ms12..ms24 → s12..s24            (font size, pt)
     *   mb0 mi0 mul0 mc0 → DROPPED — they mean "off" and are 69% of all
     *                      class tokens; dropping them is a 4.8 MB win
     *
     *   <span class="mu mb1 mi0 mul0 mal2 ms18">  becomes
     *   <span class="lu b tj s18">
     *
     * Namespaced so it stays guessable: `lu`/`la` language, `t?` alignment,
     * `s??` size, bare single letters are toggles. Note `u` (underline) and
     * `lu` (urdu) are distinct whitespace-separated tokens.
     *
     * This is a presentation encoding stored in content rows: changing the table
     * above rewrites all 12,471 values. Cheap (re-parse the same source files;
     * no UCI moves) but it argues for not churning it post-seed.
     *
     * Two source quirks the ingest must absorb: `ijtimaee-nizam.db` uses
     * single-quoted class attributes and contains `^A` control characters.
     */
    html: text('html').notNull(),
    /** Source `Book.fnotes`, verbatim — the page's footnote block, may be empty. */
    footnotes: text('footnotes'),
  },
  (t) => [
    check(
      'pages_uci_check',
      sql`${t.uci} = 'BP' || substring(${t.bookUci} from 3) || lpad(${t.pageNo}::text, 4, '0')`,
    ),
    // Upper bound is NOT cosmetic. `lpad(x, 4, '0')` TRUNCATES on overflow, so
    // page 10000 would compute the same UCI as page 1000 (`BP11000`) and pass
    // the check above — aliasing two pages onto one identifier, caught only by
    // a PK collision, and only if page 1000 happens to exist. This closes it.
    check('pages_page_no_check', sql`${t.pageNo} BETWEEN 1 AND 9999`),
    // Also serves every "pages of book X" and "page N of book X" lookup — the
    // unique's btree index covers them, so no separate index is declared.
    unique('pages_book_page_unique').on(t.bookUci, t.pageNo),
  ],
);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
