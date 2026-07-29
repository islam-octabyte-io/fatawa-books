import { BookCard } from '@/components/book-card';
import { Separator } from '@/components/ui/separator';
import { listBooks } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';

/**
 * The catalogue.
 *
 * A server component, so the API call happens on this side of the network and
 * the browser never talks to the backend directly. Any failure propagates to
 * `error.tsx`; there is no try/catch here on purpose.
 *
 * The whole corpus is 23 books and the backend caps `limit` at 100, so one
 * request covers it. When the corpus grows past 100, this is where paging goes.
 */
export default async function CataloguePage() {
  const { items, total } = await listBooks({ limit: 100 });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-heading leading-nastaliq text-3xl sm:text-4xl">
          فتاویٰ کتب
        </h1>
        {/* The count is the honest headline for a closed, frozen corpus: it is
            not a metric that will trend, it is the size of the shelf. */}
        <p className="text-muted-foreground text-sm">
          {toUrduNumerals(total)} کتابیں
        </p>
      </header>

      <Separator className="mt-6 mb-10" />

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((book) => (
          <li key={book.uci} className="flex">
            <BookCard book={book} />
          </li>
        ))}
      </ul>
    </main>
  );
}
