import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { CATALOGUE_HREF } from '@/lib/routes';

/**
 * Reached whenever `orNotFound` sees a 404 from the API: an unknown slug, a page
 * number a book does not have, a malformed UCI in a pasted link. Distinct from
 * `error.tsx` on purpose — this is a normal navigation outcome, not a fault, and
 * the only useful action is a way back to the shelf.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading leading-nastaliq text-3xl">
          یہ صفحہ موجود نہیں
        </h1>
        <p className="text-muted-foreground text-pretty">
          جو کتاب یا صفحہ آپ نے مانگا ہے، وہ اس مجموعے میں نہیں ملا۔ ممکن ہے
          صفحہ نمبر اس کتاب میں موجود نہ ہو — ہر کتاب کے صفحات چھپی ہوئی
          ترتیب کے مطابق ہیں۔
        </p>
      </div>

      <Button asChild>
        <Link href={CATALOGUE_HREF}>کتب کی فہرست پر جائیں</Link>
      </Button>
    </main>
  );
}
