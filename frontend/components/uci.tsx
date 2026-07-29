import { cn } from '@/lib/utils';

/**
 * A corpus identifier — `BF11`, `BP110026`, `BT110001`.
 *
 * These are machine-facing and Latin, so they are set in mono to look like
 * identifiers, and pinned `dir="ltr"` so the surrounding RTL context does not
 * reorder them. Extracted from `book-card.tsx`, where the pattern started, once
 * the reader and the TOC needed the same treatment.
 */
export function Uci({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn('font-mono', className)}>
      {value}
    </span>
  );
}
