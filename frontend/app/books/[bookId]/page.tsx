import { BookOpenIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BookBreadcrumb } from '@/components/book-breadcrumb';
import { BookMeta } from '@/components/book-meta';
import { TocTree } from '@/components/toc-tree';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getBook, getBookToc, listBookPages } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';
import { orNotFound } from '@/lib/not-found';
import { bookHref, pageHref } from '@/lib/routes';

type Params = { bookId: string };

/**
 * `bookId` is polymorphic at the API — a UCI (`BF11`) or a slug
 * (`fatawa-islamia-jild-2`) — and both are accepted here for the same reason:
 * a UCI in a pasted link should resolve rather than 404. Internal links use the
 * slug, built by `bookHref`.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { bookId } = await params;

  // A failure here must not take the page down with it — Next renders metadata
  // alongside the page, and the page's own fetch reports the error properly.
  try {
    const book = await getBook(bookId);
    return { title: book.title, description: book.writer ?? undefined };
  } catch {
    return {};
  }
}

export default async function BookPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { bookId } = await params;

  const book = await orNotFound(getBook(bookId));

  // A UCI in the URL resolves, then redirects to the slug, for the same reason
  // `/pages/[uci]` does: one book, one address, in history and in a search index.
  if (bookId !== book.slug) redirect(bookHref(book));

  // Two independent reads, so they go out together rather than in series. The
  // page listing is asked for a single row: all it is needed for is the number
  // of the page reading starts on, which is a printed number and not necessarily
  // 1 — books in this corpus open anywhere from page 1 to page 179.
  const [chapters, firstPage] = await Promise.all([
    orNotFound(getBookToc(bookId)),
    orNotFound(listBookPages(bookId, { limit: 1 })),
  ]);

  const startPageNo = firstPage.items.at(0)?.pageNo;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-12">
      <BookBreadcrumb book={book} />

      <header className="mt-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="flex min-w-0 flex-col gap-2">
            {/* The catalogue number is the book's place on the shelf, the same
                frozen order the catalogue lists it in. */}
            <p className="text-muted-foreground text-sm">
              جلد {toUrduNumerals(book.number)}
            </p>
            <h1 className="font-heading leading-nastaliq text-3xl text-balance sm:text-4xl">
              {book.title}
            </h1>
          </div>

          {startPageNo !== undefined ? (
            <Button asChild size="lg">
              <Link href={pageHref(book, startPageNo)}>
                <BookOpenIcon />
                پڑھنا شروع کریں
              </Link>
            </Button>
          ) : null}
        </div>

        <BookMeta book={book} />
      </header>

      <Separator className="mt-10 mb-8" />

      <section className="flex flex-col gap-5">
        <h2 className="font-heading leading-nastaliq text-2xl">فہرست</h2>
        {/* The tree arrives whole — the TOC endpoint is unpaginated and returns a
            bare array — so the filter below it runs entirely in the browser. */}
        <TocTree book={book} chapters={chapters} />
      </section>
    </main>
  );
}
