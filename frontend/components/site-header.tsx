import Link from 'next/link';

import { ThemeToggle } from '@/components/theme-toggle';
import { CATALOGUE_HREF } from '@/lib/routes';

/**
 * The one piece of chrome every route shares. Mounted in the root layout rather
 * than per page, so the reader keeps a way back to the shelf from anywhere.
 *
 * Sticky, because the reader scrolls long pages and losing the way out at the
 * top of a 2,000-word fatwa is the whole problem sticky headers solve.
 */
export function SiteHeader() {
  return (
    <header className="bg-background/85 supports-backdrop-filter:backdrop-blur-sm sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6 sm:px-8">
        <Link
          href={CATALOGUE_HREF}
          className="font-heading hover:text-primary rounded-md text-lg transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          فتاویٰ کتب
        </Link>

        <ThemeToggle />
      </div>
    </header>
  );
}
