import { pageNoFromUci } from './uci';

/**
 * Every internal URL in the app is built here.
 *
 * The routes encode two facts that are easy to get wrong at a call site, so
 * they are settled once: books are linked by slug rather than UCI (the slug is
 * unique, and `/books/fatawa-islamia-jild-2` reads as words where `BF11` does
 * not), and `pageNo` is the *printed* page number, never an offset — books
 * start anywhere from page 1 to 179 and may skip numbers, so no caller may
 * compute `pageNo ± 1`.
 */

/** What a route needs to identify a book. `BookDetail` and `Book` both satisfy it. */
type BookRef = { slug: string };

export const CATALOGUE_HREF = '/';

export function bookHref(book: BookRef): string {
  return `/books/${encodeURIComponent(book.slug)}`;
}

export function pageHref(book: BookRef, pageNo: number): string {
  return `${bookHref(book)}/p/${pageNo}`;
}

/**
 * The canonical reader URL for a page UCI — used for `prevUci`/`nextUci` and
 * for TOC entries, both of which reference pages by UCI rather than by number.
 *
 * Falls back to the `/pages/[uci]` resolver when the UCI cannot be parsed
 * locally. That route asks the API and redirects, so an unparseable identifier
 * costs a round trip instead of producing a dead link.
 */
export function pageHrefByUci(book: BookRef, pageUci: string): string {
  const pageNo = pageNoFromUci(pageUci);
  return pageNo === null
    ? pageResolverHref(pageUci)
    : pageHref(book, pageNo);
}

/** Permalink for a page, independent of which book it belongs to. */
export function pageResolverHref(pageUci: string): string {
  return `/pages/${encodeURIComponent(pageUci)}`;
}

/** Permalink for a table-of-contents entry. */
export function tocHref(tocUci: string): string {
  return `/toc/${encodeURIComponent(tocUci)}`;
}
