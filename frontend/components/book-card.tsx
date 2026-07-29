import { Card } from '@/components/ui/card';
import type { Book } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';

/**
 * One volume in the catalogue.
 *
 * Deliberately inert: `/books/[bookId]` does not exist yet, and a card that
 * lifts under the cursor but goes nowhere is a worse experience than one that
 * plainly sits still. Add the link and its hover state together.
 *
 * `--card-spacing` is zeroed rather than passing `py-0`, and the body is a plain
 * div rather than `CardContent`, because both of those would collide with the
 * card's own `py-(--card-spacing)`/`px-(--card-spacing)` on the same utility —
 * which of the two wins then depends on stylesheet order, not on intent.
 */
export function BookCard({ book }: { book: Book }) {
  return (
    <Card className="flex-1 flex-row items-stretch gap-0 [--card-spacing:0rem]">
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
        <h2 className="font-heading leading-nastaliq text-xl text-balance">
          {book.title}
        </h2>

        <p className="text-muted-foreground text-sm">
          {/* Free text from the source, and nullable — never render "null". */}
          {book.writer ?? 'مصنف نامعلوم'}
        </p>

        <div className="text-muted-foreground mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-3 text-xs">
          <span>{book.publisher ?? 'ناشر نامعلوم'}</span>
          {/*
            Identifiers are machine-facing and Latin, so they are set in mono to
            look like identifiers. `dir="ltr"` keeps `BF11` from being reordered
            by the surrounding RTL context.
          */}
          <span dir="ltr" className="font-mono">
            {book.uci}
          </span>
        </div>
      </div>
    </Card>
  );
}
