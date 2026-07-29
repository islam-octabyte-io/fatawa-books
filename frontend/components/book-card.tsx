import Link from 'next/link';

import { Uci } from '@/components/uci';
import { Card } from '@/components/ui/card';
import type { Book } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';
import { bookHref } from '@/lib/routes';

/**
 * One volume in the catalogue.
 *
 * The whole card is the link, not the title alone — the target is a single book,
 * and a large hit area is easier to aim at, especially on a phone. The hover
 * state arrives with the link, as the earlier revision of this file promised it
 * would: the ring warms toward the ink colour rather than the card moving,
 * because a shelf of 23 volumes shifting under the cursor is noise.
 *
 * `Card` takes no `asChild`, so the link wraps it rather than becoming it. The
 * wrapper carries the focus ring for the same reason `Card` cannot: the ring
 * belongs to the focusable element.
 *
 * `--card-spacing` is zeroed rather than passing `py-0`, and the body is a plain
 * div rather than `CardContent`, because both of those would collide with the
 * card's own `py-(--card-spacing)`/`px-(--card-spacing)` on the same utility —
 * which of the two wins then depends on stylesheet order, not on intent.
 */
export function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={bookHref(book)}
      className="group/book flex flex-1 rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Card className="group-hover/book:ring-primary/40 flex-1 flex-row items-stretch gap-0 transition-shadow [--card-spacing:0rem]">
        {/*
          The shelf-label band. `number` is the frozen catalogue order — the same
          order these volumes sit in on a shelf — so the numeral is carrying real
          information rather than decorating the card. It runs down the leading
          edge, which `dir="rtl"` puts on the right.
        */}
        <div
          aria-hidden
          className="bg-accent text-accent-foreground flex w-12 shrink-0 justify-center border-e pt-4 text-base font-medium tabular-nums"
        >
          {toUrduNumerals(book.number)}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 px-5 py-5">
          {/*
            Nastaliq at this size with doubled leading is the point of the layout.
            Cramming Urdu into a compact card is the usual compromise and it makes
            the script unreadable — the descenders need the room.
          */}
          <h2 className="font-heading leading-nastaliq group-hover/book:text-primary text-xl text-balance transition-colors">
            {book.title}
          </h2>

          <p className="text-muted-foreground text-sm">
            {/* Free text from the source, and nullable — never render "null". */}
            {book.writer ?? 'مصنف نامعلوم'}
          </p>

          <div className="text-muted-foreground mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-3 text-xs">
            <span>{book.publisher ?? 'ناشر نامعلوم'}</span>
            <Uci value={book.uci} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
