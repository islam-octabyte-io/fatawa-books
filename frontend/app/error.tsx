'use client';

import { Button } from '@/components/ui/button';

/**
 * The catalogue could not be fetched.
 *
 * By far the most likely cause during development is that the backend is not
 * running, so the message says which service and which origin rather than
 * showing a stack trace. `ApiRequestError` already phrases that case; anything
 * else falls through to its own message.
 *
 * Next requires this boundary to be a client component — it has to attach the
 * retry handler in the browser.
 */
export default function CatalogueError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col items-start justify-center gap-5 px-6">
      <h1 className="font-heading leading-nastaliq text-2xl">
        کتابیں لوڈ نہیں ہو سکیں
      </h1>

      {/* Latin technical text inside an RTL page: pin the direction so the
          message and any URL in it are not reordered. */}
      <p
        dir="ltr"
        className="text-muted-foreground border-s ps-4 text-start text-sm"
      >
        {error.message}
      </p>

      <Button onClick={reset}>دوبارہ کوشش کریں</Button>
    </main>
  );
}
