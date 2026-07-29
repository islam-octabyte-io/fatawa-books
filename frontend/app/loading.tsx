import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shown while the catalogue request is in flight.
 *
 * The placeholder count is fixed at the current corpus size rather than read
 * from anywhere — nothing is known yet at this point, and a grid that matches
 * the real one means the layout does not jump when the data lands.
 */
const PLACEHOLDER_COUNT = 23;

export default function CatalogueLoading() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-20" />
      </header>

      <Separator className="mt-6 mb-10" />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
          <div
            key={index}
            className="bg-card ring-foreground/10 flex overflow-hidden rounded-xl ring-1"
          >
            <div className="bg-accent w-12 shrink-0 border-e" />
            <div className="flex flex-1 flex-col gap-3 px-5 py-5">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="mt-1 h-4 w-1/2" />
              <Skeleton className="mt-3 h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
