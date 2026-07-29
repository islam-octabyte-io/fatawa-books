import { notFound, redirect } from 'next/navigation';

import { getBook, getPageByUci } from '@/lib/api';
import { orNotFound } from '@/lib/not-found';
import { pageHref } from '@/lib/routes';
import { isPageUci } from '@/lib/uci';

/**
 * Permalink for a page UCI — `/pages/BP110026`.
 *
 * The reader's own URLs are keyed on the book slug and the printed page number,
 * because those are the two things a reader can read off the paper in front of
 * them. A UCI is the durable identifier the API and the database speak, and it
 * turns up in pasted links and in `prevUci`/`nextUci` that could not be parsed
 * locally. This route resolves one and redirects to the canonical URL, so there
 * is exactly one address per page in the browser's history and in a search index.
 */
export default async function PageByUci({
  params,
}: {
  params: Promise<{ uci: string }>;
}) {
  const { uci } = await params;

  // A value that is not `BP` followed by digits fails the API's parameter
  // validation, which answers 400 — a fault, as far as `orNotFound` is concerned,
  // and the reader would get an error page for what is only a bad link. Checked
  // here so a malformed identifier lands on not-found, where it belongs. The API
  // is case-insensitive, so `bp10005` still resolves.
  if (!isPageUci(uci)) notFound();

  const page = await orNotFound(getPageByUci(uci));
  const book = await orNotFound(getBook(page.bookUci));

  redirect(pageHref(book, page.pageNo));
}
