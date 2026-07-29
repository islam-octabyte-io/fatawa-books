import { notFound, redirect } from 'next/navigation';

import { getBook, getTocEntry } from '@/lib/api';
import { orNotFound } from '@/lib/not-found';
import { pageHrefByUci } from '@/lib/routes';
import { isTocUci } from '@/lib/uci';

/**
 * Permalink for a table-of-contents entry — `/toc/BT110001`.
 *
 * A TOC entry is a title and a pointer, not a destination of its own: what a
 * reader wants when they follow one is the page it opens on. So this resolves the
 * entry, then redirects to that page rather than rendering a stub in between.
 *
 * The tree inside the app links straight to the page for the same reason and does
 * not route through here; this exists for UCIs arriving from outside.
 */
export default async function TocEntryByUci({
  params,
}: {
  params: Promise<{ uci: string }>;
}) {
  const { uci } = await params;

  // See `/pages/[uci]`: a malformed identifier is a 400 from the API's parameter
  // validation, which would read as a fault rather than a bad link.
  if (!isTocUci(uci)) notFound();

  const entry = await orNotFound(getTocEntry(uci));
  const book = await orNotFound(getBook(entry.bookUci));

  redirect(pageHrefByUci(book, entry.pageUci));
}
