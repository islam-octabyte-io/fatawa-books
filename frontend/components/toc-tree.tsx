'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { TocFilter } from '@/components/toc-filter';
import type { TocChapter } from '@/lib/api';
import { toUrduNumerals } from '@/lib/format';
import { pageHrefByUci } from '@/lib/routes';
import { cn } from '@/lib/utils';

/**
 * A book's table of contents, filterable.
 *
 * The hierarchy is exactly two levels and cannot be deeper: level 1 is a chapter
 * (source `h1`), level 2 is an individual fatwa title (source `h2`), and the
 * schema's CHECK constraint enforces that a level-2 entry has a parent and a
 * level-1 entry does not. So this renders a nested list, not a recursive tree —
 * recursion here would be machinery for a case the data cannot produce.
 *
 * Client-side because of the filter. The whole tree arrives in one unpaginated
 * response (at most 2,067 titles for the largest book, titles only), so
 * filtering in the browser is instant and costs no request.
 */
export function TocTree({
  book,
  chapters,
  currentPageNo,
  className,
}: {
  book: { slug: string };
  chapters: TocChapter[];
  /** Highlights the entries that live on the page being read. */
  currentPageNo?: number;
  className?: string;
}) {
  const [query, setQuery] = useState('');

  const totalCount = useMemo(
    () =>
      chapters.reduce(
        (count, chapter) => count + 1 + chapter.children.length,
        0,
      ),
    [chapters],
  );

  const visible = useMemo(() => filterChapters(chapters, query), [
    chapters,
    query,
  ]);

  const matchCount = useMemo(
    () =>
      visible.reduce((count, chapter) => count + 1 + chapter.children.length, 0),
    [visible],
  );

  return (
    <div className={cn('flex min-h-0 flex-col gap-4', className)}>
      <TocFilter
        value={query}
        onValueChange={setQuery}
        matchCount={matchCount}
        totalCount={totalCount}
      />

      {visible.length === 0 ? (
        <EmptyState
          title={
            totalCount === 0 ? 'اس کتاب کی فہرست خالی ہے' : 'کوئی عنوان نہیں ملا'
          }
          hint={
            totalCount === 0
              ? undefined
              : 'فلٹر صرف عنوانات پر لاگو ہوتا ہے، متن پر نہیں'
          }
        />
      ) : (
        <ul className="flex flex-col gap-6">
          {visible.map((chapter) => (
            <li key={chapter.uci} className="flex flex-col gap-1">
              <TocLink
                book={book}
                entry={chapter}
                currentPageNo={currentPageNo}
                className="font-heading leading-nastaliq text-base"
              />

              {chapter.children.length > 0 ? (
                // The border runs down the leading edge, which `dir="rtl"` puts
                // on the right, so the indent reads as an indent.
                <ul className="border-s ps-3 ms-1 flex flex-col">
                  {chapter.children.map((entry) => (
                    <li key={entry.uci}>
                      <TocLink
                        book={book}
                        entry={entry}
                        currentPageNo={currentPageNo}
                        className="text-sm"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** One title, linked to the page it opens on. */
function TocLink({
  book,
  entry,
  currentPageNo,
  className,
}: {
  book: { slug: string };
  entry: { uci: string; title: string; pageUci: string; pageNo: number };
  currentPageNo?: number;
  className?: string;
}) {
  const isCurrent = currentPageNo === entry.pageNo;

  return (
    <Link
      href={pageHrefByUci(book, entry.pageUci)}
      aria-current={isCurrent ? 'true' : undefined}
      className={cn(
        'hover:bg-muted flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        isCurrent && 'bg-accent text-accent-foreground',
        className,
      )}
    >
      <span className="min-w-0 text-pretty">{entry.title}</span>
      {/* The printed page number, right off `pageUci` — the reader's whole
          orientation depends on it matching the paper. */}
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {toUrduNumerals(entry.pageNo)}
      </span>
    </Link>
  );
}

/**
 * Urdu and Arabic diacritics are optional in typing but common in typeset text,
 * so a reader searching `نماز` should still match `نَماز`. Stripping the marks
 * from both sides is the cheapest way to get that, and it is why this is not a
 * bare `includes`.
 */
const DIACRITICS = /[ً-ْٰٓ-ٕـ]/g;

function normalize(value: string): string {
  return value.replace(DIACRITICS, '').replace(/\s+/g, ' ').trim();
}

/**
 * Keeps a chapter when it matches itself — with all its children, since the
 * chapter is the answer — or when any child matches, in which case only the
 * matching children are shown.
 */
function filterChapters(
  chapters: TocChapter[],
  query: string,
): TocChapter[] {
  const needle = normalize(query);
  if (needle.length === 0) return chapters;

  return chapters.flatMap((chapter) => {
    if (normalize(chapter.title).includes(needle)) return [chapter];

    const children = chapter.children.filter((entry) =>
      normalize(entry.title).includes(needle),
    );

    return children.length > 0 ? [{ ...chapter, children }] : [];
  });
}
