import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { BookBreadcrumb } from '@/components/book-breadcrumb';
import { Footnotes } from '@/components/footnotes';
import { PageHtml } from '@/components/page-html';
import { PageJump } from '@/components/page-jump';
import { PageTurner } from '@/components/page-turner';
import { TocSheet } from '@/components/toc-sheet';
import { TocTree } from '@/components/toc-tree';
import { Separator } from '@/components/ui/separator';
import { getBook, getBookToc, getPage, listBookPages } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';
import { orNotFound } from '@/lib/not-found';
import { pageHref } from '@/lib/routes';

type Params = { bookId: string; pageNo: string };

/**
 * `pageNo` arrives as a string from the URL. Only a positive integer can be a
 * printed page number, so anything else is a bad link rather than a page the
 * corpus is missing — rejected here instead of being sent to the API to 400.
 */
function parsePageNo(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;

  const pageNo = Number(raw);
  // The backend's own bound: the 4-digit position field in a page UCI is frozen.
  return pageNo >= 1 && pageNo <= 9999 ? pageNo : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { bookId, pageNo } = await params;

  try {
    const book = await getBook(bookId);
    return { title: `${book.title} — صفحہ ${pageNo}` };
  } catch {
    // Metadata renders alongside the page; the page's own fetch reports faults.
    return {};
  }
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { bookId, pageNo: rawPageNo } = await params;

  const pageNo = parsePageNo(rawPageNo);
  if (pageNo === null) notFound();

  const book = await orNotFound(getBook(bookId));

  // As on the book page: a UCI resolves, then redirects to the slug form so a
  // page has one canonical address.
  if (bookId !== book.slug) redirect(pageHref(book, pageNo));

  // Three independent reads in parallel. The page listing asks for a single
  // summary row — no HTML crosses the wire — and exists to give `PageJump` the
  // book's real first and last printed page numbers, which are not `1` and
  // `pageCount`: books open as late as page 179 and the numbering can skip.
  const [page, chapters, firstPage] = await Promise.all([
    orNotFound(getPage(bookId, pageNo)),
    orNotFound(getBookToc(bookId)),
    orNotFound(listBookPages(bookId, { limit: 1 })),
  ]);

  const lastPage =
    firstPage.total > 1
      ? await orNotFound(
          listBookPages(bookId, { limit: 1, offset: firstPage.total - 1 }),
        )
      : firstPage;

  const firstPageNo = firstPage.items.at(0)?.pageNo;
  const lastPageNo = lastPage.items.at(0)?.pageNo;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BookBreadcrumb
          book={book}
          pageNo={page.pageNo}
          className="min-w-0 flex-1"
        />

        {/* The sidebar carries the TOC from `lg` up, so the trigger is hidden
            there rather than rendering the same tree twice on one screen. */}
        <div className="lg:hidden">
          <TocSheet
            book={book}
            chapters={chapters}
            currentPageNo={page.pageNo}
          />
        </div>
      </div>

      <div className="mt-8 flex gap-10">
        <main className="min-w-0 flex-1">
          {/* `prose`-style measure: Nastaliq needs a generous line height and a
              bounded measure, and a full 6xl of justified Urdu is unreadable. */}
          <article className="mx-auto max-w-2xl">
            <PageHtml html={page.html} />
            <Footnotes block={page.footnotes} />
          </article>

          <Separator className="mt-12 mb-6" />

          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <PageTurner
              book={book}
              prevUci={page.prevUci}
              nextUci={page.nextUci}
            />

            <div className="flex flex-wrap items-start justify-between gap-4">
              <p className="text-muted-foreground text-sm tabular-nums">
                صفحہ {toUrduNumerals(page.pageNo)}
                {firstPageNo !== undefined && lastPageNo !== undefined ? (
                  <span className="text-muted-foreground/70">
                    {' '}
                    ({toUrduNumerals(firstPageNo)}–
                    {toUrduNumerals(lastPageNo)})
                  </span>
                ) : null}
              </p>

              {firstPageNo !== undefined && lastPageNo !== undefined ? (
                <PageJump
                  book={book}
                  firstPageNo={firstPageNo}
                  lastPageNo={lastPageNo}
                />
              ) : null}
            </div>
          </div>
        </main>

        {/* Sticky so the contents stay reachable through a long page, and its own
            scroll container so a 2,067-entry tree does not stretch the layout. */}
        <aside className="hidden w-80 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
            <TocTree
              book={book}
              chapters={chapters}
              currentPageNo={page.pageNo}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
