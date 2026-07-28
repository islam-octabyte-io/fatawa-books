/**
 * The TypeScript counterpart to the UCI `CHECK` constraints in `./schema/`.
 *
 * These formulas are duplicated in exactly two places on purpose — here and in
 * the SQL CHECKs — and must never diverge. Build every UCI through these
 * helpers so seeds can compute identifiers up front instead of round-tripping
 * inserted rows to learn FK values.
 *
 * Corpus `B` registry: see `./schema/books.ts`.
 */

export const BOOK_PREFIX = 'BF';
export const PAGE_PREFIX = 'BP';
export const TOC_PREFIX = 'BT';

/**
 * Width of the trailing position field in a composite UCI. This is a FROZEN
 * ceiling: widening it would rewrite every published `BP`/`BT` identifier.
 * Current corpus maxima are 2,029 pages and 2,067 TOC entries in one book.
 */
export const POSITION_WIDTH = 4;
const POSITION_MAX = 10 ** POSITION_WIDTH - 1;

function assertPositive(label: string, value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer, got ${value}`);
  }
}

function positionField(label: string, value: number): string {
  assertPositive(label, value);

  // Loud, not silent: a truncated position would produce a UCI that collides
  // with another row and fails the CHECK on insert anyway, but far from cause.
  if (value > POSITION_MAX) {
    throw new Error(
      `${label} ${value} exceeds the frozen ${POSITION_WIDTH}-digit UCI ceiling of ${POSITION_MAX}`,
    );
  }

  return String(value).padStart(POSITION_WIDTH, '0');
}

/** `buildBookUci(1)` → `'BF1'` */
export function buildBookUci(bookNumber: number): string {
  assertPositive('bookNumber', bookNumber);
  return `${BOOK_PREFIX}${bookNumber}`;
}

/** `buildPageUci(1, 26)` → `'BP10026'` (book 1, printed page 26) */
export function buildPageUci(bookNumber: number, pageNo: number): string {
  assertPositive('bookNumber', bookNumber);
  return `${PAGE_PREFIX}${bookNumber}${positionField('pageNo', pageNo)}`;
}

/** `buildTocUci(1, 1)` → `'BT10001'` (book 1, TOC entry 1) */
export function buildTocUci(bookNumber: number, numberInBook: number): string {
  assertPositive('bookNumber', bookNumber);
  return `${TOC_PREFIX}${bookNumber}${positionField('numberInBook', numberInBook)}`;
}

export const BOOK_UCI = /^BF\d+$/i;
export const PAGE_UCI = /^BP\d+$/i;
export const TOC_UCI = /^BT\d+$/i;

/**
 * Inverse of `buildPageUci`/`buildTocUci`. Parses right-to-left: the last
 * {@link POSITION_WIDTH} digits are the position, everything between the 2-char
 * prefix and them is the book number.
 *
 * Returns `null` rather than throwing, so callers can fall through to the other
 * accepted identifier forms (bare number, slug, `parent:child`) at the API edge.
 */
export function parseCompositeUci(
  uci: string,
): { prefix: string; bookNumber: number; position: number } | null {
  const value = uci.toUpperCase();
  if (!PAGE_UCI.test(value) && !TOC_UCI.test(value)) return null;

  const digits = value.slice(2);
  // Needs at least one book digit plus a full-width position field.
  if (digits.length <= POSITION_WIDTH) return null;

  const bookNumber = Number(digits.slice(0, -POSITION_WIDTH));
  const position = Number(digits.slice(-POSITION_WIDTH));
  if (bookNumber < 1 || position < 1) return null;

  return { prefix: value.slice(0, 2), bookNumber, position };
}
