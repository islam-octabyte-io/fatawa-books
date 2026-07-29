/**
 * Reading printed page numbers back out of a page UCI.
 *
 * This mirrors `parseCompositeUci` in `backend/src/db/uci.ts` — the same
 * right-to-left parse, the same frozen 4-digit position field. Duplicating a
 * backend invariant is normally the wrong trade, and it is taken here for one
 * reason: `PageDetail` hands the reader `prevUci`/`nextUci`, but the reader's
 * URLs are keyed on the printed page number. Without a local parse, every page
 * turn would have to resolve the neighbour through `/api/pages/:uci` and then
 * redirect — a network round trip and a wasted render on the single most
 * frequent interaction in the app.
 *
 * The formula is safe to copy because it cannot move: widening
 * `POSITION_WIDTH` would rewrite every published `BP`/`BT` identifier, which is
 * why the backend calls it a frozen ceiling. If it ever does move, the fallback
 * below degrades to correct-but-slower rather than to broken links.
 */

/** Frozen in the backend and in the SQL CHECK constraints. Do not widen. */
const POSITION_WIDTH = 4;

/**
 * The shapes the API's path parameters are validated against. A value that fails
 * these gets a 400 from the validation pipe rather than a 404 — which would
 * surface to the reader as a server fault instead of a bad link — so the resolver
 * routes check the shape before asking. Mirrors `backend/src/db/uci.ts`.
 */
const PAGE_UCI = /^BP\d+$/i;
const TOC_UCI = /^BT\d+$/i;

export function isPageUci(value: string): boolean {
  return PAGE_UCI.test(value);
}

export function isTocUci(value: string): boolean {
  return TOC_UCI.test(value);
}

export type ParsedPageUci = {
  /** The book's catalogue number, e.g. 11 for `BP110026`. */
  bookNumber: number;
  /** The printed page number, e.g. 26 for `BP110026`. */
  pageNo: number;
};

/**
 * `parsePageUci('BP110026')` → `{ bookNumber: 11, pageNo: 26 }`
 *
 * Returns `null` for anything that is not a well-formed page UCI, so callers
 * can fall back to the `/pages/[uci]` resolver route instead of building a URL
 * that would 404.
 */
export function parsePageUci(uci: string): ParsedPageUci | null {
  const value = uci.toUpperCase();
  if (!PAGE_UCI.test(value)) return null;

  const digits = value.slice(2);
  // Needs at least one book digit on top of a full-width position field.
  if (digits.length <= POSITION_WIDTH) return null;

  const bookNumber = Number(digits.slice(0, -POSITION_WIDTH));
  const pageNo = Number(digits.slice(-POSITION_WIDTH));
  if (bookNumber < 1 || pageNo < 1) return null;

  return { bookNumber, pageNo };
}

/** Just the printed page number, for the common case of building a URL. */
export function pageNoFromUci(uci: string): number | null {
  return parsePageUci(uci)?.pageNo ?? null;
}
