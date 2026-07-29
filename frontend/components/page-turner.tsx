import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { toUrduNumerals } from '@/lib/format';
import { pageHrefByUci } from '@/lib/routes';
import { pageNoFromUci } from '@/lib/uci';

/**
 * Backward and forward through a book.
 *
 * Both neighbours come from `prevUci`/`nextUci` on the page itself, which the
 * backend *queries* rather than derives. That matters: `pageNo` is the printed
 * page number, books open anywhere from page 1 to 179, and numbers can skip — so
 * `pageNo ± 1` would land on a page that does not exist. Nothing here does
 * arithmetic on a page number; the UCIs are followed.
 *
 * Direction is the other trap. In RTL, reading forward moves *leftward*, so the
 * chevrons are chosen by role and mirrored with `rtl:rotate-180`, and the flex
 * order puts "previous" first — which `dir="rtl"` renders on the right, where a
 * reader of this script reaches for it.
 *
 * A missing neighbour renders a disabled control rather than nothing at all, so
 * the row keeps its shape at the first and last page of a book instead of
 * reflowing the layout under the reader's cursor.
 */
export function PageTurner({
  book,
  prevUci,
  nextUci,
}: {
  book: { slug: string };
  prevUci: string | null;
  nextUci: string | null;
}) {
  return (
    <nav
      aria-label="صفحات کی ترتیب"
      className="flex items-center justify-between gap-3"
    >
      <TurnButton book={book} uci={prevUci} direction="previous" />
      <TurnButton book={book} uci={nextUci} direction="next" />
    </nav>
  );
}

function TurnButton({
  book,
  uci,
  direction,
}: {
  book: { slug: string };
  uci: string | null;
  direction: 'previous' | 'next';
}) {
  const isPrevious = direction === 'previous';
  const label = isPrevious ? 'پچھلا صفحہ' : 'اگلا صفحہ';

  // The icons are named for where they point in LTR — back is left, forward is
  // right — and `rtl:rotate-180` mirrors them. Under `dir="rtl"` that lands
  // "previous" pointing right, toward the start of the book, which is where a
  // reader of this script came from. Choosing the RTL-facing icon *and* rotating
  // it would cancel out and send both arrows the wrong way.
  const Icon = isPrevious ? ChevronLeftIcon : ChevronRightIcon;
  const icon = <Icon className="rtl:rotate-180" />;

  if (uci === null) {
    return (
      <Button variant="outline" size="lg" disabled aria-label={label}>
        {isPrevious ? icon : null}
        <span className="text-muted-foreground">
          {isPrevious ? 'کتاب کا آغاز' : 'کتاب کا اختتام'}
        </span>
        {isPrevious ? null : icon}
      </Button>
    );
  }

  const pageNo = pageNoFromUci(uci);

  return (
    <Button asChild variant="outline" size="lg">
      <Link href={pageHrefByUci(book, uci)} rel={isPrevious ? 'prev' : 'next'}>
        {isPrevious ? icon : null}
        <span>
          {label}
          {pageNo === null ? null : (
            <span className="text-muted-foreground ms-1.5 tabular-nums">
              {toUrduNumerals(pageNo)}
            </span>
          )}
        </span>
        {isPrevious ? null : icon}
      </Link>
    </Button>
  );
}
