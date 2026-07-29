import { SearchIcon, XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toUrduNumerals } from '@/lib/format';

/**
 * The filter box above a table of contents.
 *
 * Deliberately labelled a filter, not a search: it narrows the TOC titles the
 * page has already loaded and never touches the body text of a fatwa. The API
 * has no search endpoint — pages store presentation HTML with no plain-text
 * column — so a box promising search would under-deliver on every query. The
 * result count is shown for the same reason: it makes the scope legible.
 *
 * Controlled by the tree above it so the sidebar and the mobile sheet can share
 * one filter state instead of drifting apart. No `'use client'` of its own: it
 * holds no state, and the directive would mark it a client entry point whose
 * props must be serializable — which `onValueChange` is not.
 */
export function TocFilter({
  value,
  onValueChange,
  matchCount,
  totalCount,
}: {
  value: string;
  onValueChange: (value: string) => void;
  matchCount: number;
  totalCount: number;
}) {
  const filtering = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <SearchIcon
          aria-hidden
          className="text-muted-foreground pointer-events-none absolute inset-y-0 start-3 my-auto size-4"
        />
        <Input
          type="search"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="عنوان تلاش کریں"
          aria-label="فہرست کے عنوانات میں فلٹر"
          className="ps-9 pe-9"
        />
        {filtering ? (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="فلٹر ہٹائیں"
            onClick={() => onValueChange('')}
            className="absolute inset-y-0 end-2 my-auto"
          >
            <XIcon />
          </Button>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs" aria-live="polite">
        {filtering
          ? `${toUrduNumerals(matchCount)} عنوانات ملے`
          : `${toUrduNumerals(totalCount)} عنوانات — صرف عنوانات میں فلٹر ہوتا ہے`}
      </p>
    </div>
  );
}
