import type { ReactNode } from 'react';

import { Uci } from '@/components/uci';
import type { Book, BookDetail } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * A book's attribution and size.
 *
 * Every field here is nullable or absent depending on the caller, and the
 * fallbacks are the reason this is a component rather than inline markup:
 * `writer` and `publisher` are free text straight from the source and rendering
 * a literal "null" into Urdu prose is the failure mode worth designing out once.
 *
 * `writer` frequently packs several scholars into one string and spells the same
 * name differently across books, so it is displayed and never treated as a key.
 *
 * Counts are only present on `BookDetail`, so they render when supplied and are
 * simply omitted otherwise — the reader header does not need them.
 */
export function BookMeta({
  book,
  className,
}: {
  book: Book | BookDetail;
  className?: string;
}) {
  const counts = 'pageCount' in book ? book : null;

  return (
    <dl
      className={cn(
        'text-muted-foreground grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2',
        className,
      )}
    >
      <Field label="مصنف" value={book.writer ?? 'مصنف نامعلوم'} />
      <Field label="ناشر" value={book.publisher ?? 'ناشر نامعلوم'} />

      {counts ? (
        <>
          <Field
            label="صفحات"
            value={`${toUrduNumerals(counts.pageCount)} صفحے`}
          />
          <Field
            label="فہرست"
            value={`${toUrduNumerals(counts.tocEntryCount)} عنوانات`}
          />
        </>
      ) : null}

      <Field label="شناخت" value={<Uci value={book.uci} />} />
    </dl>
  );
}

/** One label/value pair. Local because nothing outside this file needs it. */
function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-muted-foreground/70 text-xs">{label}</dt>
      <dd className="text-foreground text-pretty">{value}</dd>
    </div>
  );
}
