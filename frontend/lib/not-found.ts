import { notFound } from 'next/navigation';

import { ApiRequestError } from './api';

/**
 * Turns the API's 404 into Next's `not-found` render, and lets everything else
 * through to `error.tsx`.
 *
 * The distinction matters to the reader: a slug that does not exist, or a
 * printed page number a book does not have, is a normal navigation outcome and
 * should look like a missing page. A 500 or a refused connection is a fault and
 * should look like one. Doing this in a helper keeps every route from repeating
 * the same try/catch and, more importantly, from getting the rethrow wrong —
 * swallowing a non-404 here would silently render "not found" for an outage.
 *
 * IMPORTANT — do not add a `loading.tsx` to a route that calls this.
 *
 * A loading file opens a Suspense boundary, which makes Next flush the shell
 * before the data fetch resolves. Once the response has started, the status code
 * is already committed, so `notFound()` can only swap the body: the route then
 * answers 200 for a page that does not exist, and `redirect()` in the resolver
 * routes stops emitting a real 307. This was measured, not guessed — the three
 * `loading.tsx` files this app used to carry were removed for exactly that
 * reason. They also bought very little: the slowest route in the corpus, a book
 * with 2,067 table-of-contents entries, renders in about 120ms, and Next keeps
 * the current page on screen while the next one is fetched.
 */
export async function orNotFound<T>(request: Promise<T>): Promise<T> {
  try {
    return await request;
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) notFound();
    throw error;
  }
}
