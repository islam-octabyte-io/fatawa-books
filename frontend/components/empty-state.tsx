import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Nothing-to-show, for a filter that matched nothing and for a book whose TOC
 * is empty. One component because the two cases differ only in wording, and a
 * bare "0 results" in an RTL layout with no vertical centring looks like a bug.
 */
export function EmptyState({
  title,
  hint,
  className,
}: {
  title: string;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-muted-foreground flex flex-col items-center gap-1 px-4 py-12 text-center',
        className,
      )}
    >
      <p className="font-heading leading-nastaliq text-base">{title}</p>
      {hint ? <p className="text-sm">{hint}</p> : null}
    </div>
  );
}
