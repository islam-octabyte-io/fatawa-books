import Link from 'next/link';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { Book } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';
import { bookHref, CATALOGUE_HREF } from '@/lib/routes';
import { cn } from '@/lib/utils';

/**
 * Shelf › book › page.
 *
 * The book title is the only long segment, so it truncates rather than wrapping
 * — a three-line breadcrumb above a reader pushes the text off the screen.
 *
 * `min-w-0` appears at every level down to the truncating item because a flex
 * item defaults to `min-width: auto`: without it the trail will not shrink below
 * its content and `truncate` never engages, whatever the title's length. The
 * longest title in the corpus still fits at 320px, so this is what keeps a
 * longer one arriving later from forcing the row wider than its column rather
 * than a fix for an overflow observed today.
 *
 * When `pageNo` is given the title becomes a link and the page becomes the
 * current crumb; otherwise the title is current and there is no third segment.
 */
export function BookBreadcrumb({
  book,
  pageNo,
  className,
}: {
  book: Pick<Book, 'slug' | 'title'>;
  pageNo?: number;
  className?: string;
}) {
  const onPage = pageNo !== undefined;

  return (
    <Breadcrumb className={cn('min-w-0', className)}>
      <BreadcrumbList className="min-w-0 flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={CATALOGUE_HREF}>کتب</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        <BreadcrumbItem className="min-w-0">
          {onPage ? (
            <BreadcrumbLink asChild>
              <Link href={bookHref(book)} className="block truncate">
                {book.title}
              </Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="block truncate">
              {book.title}
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {onPage ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {/* The printed page number, so it is stated the way the book
                  states it — Urdu numerals, and never an offset. */}
              <BreadcrumbPage className="whitespace-nowrap">
                صفحہ {toUrduNumerals(pageNo)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
