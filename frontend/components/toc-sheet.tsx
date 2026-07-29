'use client';

import { ListIcon } from 'lucide-react';

import { TocTree } from '@/components/toc-tree';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { TocChapter } from '@/lib/api';

/**
 * The table of contents on a narrow screen.
 *
 * The reader shows the same `TocTree` as a sidebar at `lg` and up; below that the
 * page is only wide enough for one column, and Nastaliq needs the full measure to
 * stay readable, so the tree moves behind a trigger instead of being cut down.
 *
 * `side="right"` is the *leading* edge under `dir="rtl"` — the sheet opens from
 * the same side the reader's eye starts on, which is where the trigger sits.
 */
export function TocSheet({
  book,
  chapters,
  currentPageNo,
}: {
  book: { slug: string };
  chapters: TocChapter[];
  currentPageNo?: number;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="lg">
          <ListIcon />
          فہرست
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading leading-nastaliq">
            فہرست
          </SheetTitle>
          <SheetDescription>
            عنوان پر کلک کریں تاکہ اس کا صفحہ کھل جائے
          </SheetDescription>
        </SheetHeader>

        {/* The tree can run to 2,067 titles, so it scrolls inside the sheet
            rather than the sheet growing past the viewport. */}
        <ScrollArea className="min-h-0 flex-1">
          <TocTree
            book={book}
            chapters={chapters}
            currentPageNo={currentPageNo}
            className="px-4 pb-6"
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
