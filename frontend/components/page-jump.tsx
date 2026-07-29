'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toUrduNumerals } from '@/lib/format';
import { pageHref } from '@/lib/routes';

/**
 * Jump straight to a printed page number.
 *
 * Two things make this less trivial than it looks. First, the number entered is
 * the number printed on the paper — a book in this corpus can open on page 179 —
 * so the accepted range is the book's own first and last page, not `1..pageCount`.
 * Second, the numbering is not guaranteed contiguous: a number inside the range
 * can still be missing, which the route resolves as a 404 and the reader sees as
 * the not-found page. Validating the range here keeps the obvious mistake
 * (a number the book plainly does not reach) from costing a navigation, without
 * pretending the client knows which numbers exist.
 *
 * Western digits in the field, deliberately: the input is typed with a keyboard,
 * and `Intl` numerals are a presentation form. The bounds beside it are shown in
 * Urdu numerals to match the rest of the interface.
 */
export function PageJump({
  book,
  firstPageNo,
  lastPageNo,
}: {
  book: { slug: string };
  firstPageNo: number;
  lastPageNo: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const pageNo = Number(value.trim());
    if (!Number.isInteger(pageNo) || pageNo < firstPageNo || pageNo > lastPageNo) {
      setError(
        `صفحہ ${toUrduNumerals(firstPageNo)} سے ${toUrduNumerals(lastPageNo)} کے درمیان ہونا چاہیے`,
      );
      return;
    }

    setError(null);
    router.push(pageHref(book, pageNo));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="page-jump" className="text-muted-foreground text-xs">
          صفحہ
        </label>
        <Input
          id="page-jump"
          dir="ltr"
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          aria-invalid={error !== null}
          aria-describedby={error === null ? undefined : 'page-jump-error'}
          placeholder={String(firstPageNo)}
          className="w-20 text-center tabular-nums"
        />
        <Button type="submit" variant="secondary" disabled={value.trim() === ''}>
          جائیں
        </Button>
      </div>

      <p
        id="page-jump-error"
        className="text-destructive min-h-4 text-xs"
        aria-live="polite"
      >
        {error}
      </p>
    </form>
  );
}
