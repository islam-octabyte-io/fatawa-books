import type { components } from './api-types';

/**
 * Typed access to the backend's read API.
 *
 * There is no generated client here on purpose — every endpoint is a `GET` with
 * at most two query parameters, so a client library would be more machinery than
 * the surface warrants. What *is* generated is the type layer: `api-types.d.ts`
 * comes straight from the backend's OpenAPI document via `pnpm api:types`, so
 * these shapes cannot drift from the wire without a type error appearing here.
 */

type Schemas = components['schemas'];

/**
 * The `_Output` suffix is not ours: Zod 4 registers separate input and output
 * variants for a schema, and nestjs-zod names the response side accordingly.
 * Re-exported without it so call sites read like the domain, not the toolchain.
 */
export type Book = Schemas['Book_Output'];
export type BookDetail = Schemas['BookDetail_Output'];
export type PaginatedBooks = Schemas['PaginatedBooks_Output'];
export type PageSummary = Schemas['PageSummary_Output'];
export type PageDetail = Schemas['PageDetail_Output'];
export type PaginatedPageSummaries = Schemas['PaginatedPageSummaries_Output'];
export type TocEntry = Schemas['TocEntry_Output'];
export type TocChapter = Schemas['TocChapter_Output'];
export type TocEntryDetail = Schemas['TocEntryDetail_Output'];
export type Health = Schemas['Health_Output'];

/** The 404/503 body. */
type ApiErrorBody = Schemas['ApiError'];
/** The 400 body that nestjs-zod produces. Note it is NOT a subset of the above. */
type ValidationErrorBody = Schemas['ValidationError'];

/**
 * Server-only. The API is called from server components, so this never reaches
 * the browser and deliberately carries no `NEXT_PUBLIC_` prefix. The fallback
 * matches `backend/.env.example`, which keeps local dev working with no env file
 * at all.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:4004';

/**
 * A failed API call, carrying whichever error body the backend sent.
 *
 * The backend has two error shapes that do not nest: `{statusCode, message,
 * error?}` for 404 and 503, and `{statusCode: 400, message: 'Validation
 * failed', errors?}` from nestjs-zod's pipe. Narrowing on `validationErrors`
 * tells the two apart without re-reading the status code.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly path: string;
  /** Present only on a 400 from the validation pipe. */
  readonly validationErrors?: unknown[];

  constructor(args: {
    status: number;
    path: string;
    message: string;
    validationErrors?: unknown[];
  }) {
    super(args.message);
    this.name = 'ApiRequestError';
    this.status = args.status;
    this.path = args.path;
    this.validationErrors = args.validationErrors;
  }
}

function isValidationErrorBody(
  body: ApiErrorBody | ValidationErrorBody,
): body is ValidationErrorBody {
  return body.statusCode === 400;
}

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/json' },
      // The corpus is loaded by an offline ingest and never changes while the
      // process runs, so revalidation would only ever re-fetch identical bytes.
      // Revisit this the day content becomes editable at runtime.
      cache: 'force-cache',
    });
  } catch {
    // A refused connection is the common case in development — surface the
    // origin, because "fetch failed" alone does not say which service is down.
    throw new ApiRequestError({
      status: 0,
      path,
      message: `Could not reach the API at ${API_URL}. Is the backend running?`,
    });
  }

  if (!response.ok) {
    // An error body is expected but not guaranteed — a proxy or a crash can
    // return HTML, so a parse failure must not mask the real status.
    const body = (await response.json().catch(() => null)) as
      | ApiErrorBody
      | ValidationErrorBody
      | null;

    throw new ApiRequestError({
      status: response.status,
      path,
      message: body?.message ?? `${response.status} ${response.statusText}`,
      validationErrors:
        body && isValidationErrorBody(body) ? body.errors : undefined,
    });
  }

  return response.json() as Promise<T>;
}

/**
 * The catalogue. `limit` is capped at 100 by the backend; the whole corpus is 23
 * books, so one page covers it today.
 */
export function listBooks(
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedBooks> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const suffix = query.size > 0 ? `?${query}` : '';
  return apiFetch<PaginatedBooks>(`/api/books${suffix}`);
}

/** `bookId` accepts either the UCI (`BF11`) or the slug (`fatawa-islamia-jild-2`). */
export function getBook(bookId: string): Promise<BookDetail> {
  return apiFetch<BookDetail>(`/api/books/${encodeURIComponent(bookId)}`);
}

/**
 * NOTE for whoever adds the reader: the TOC endpoints (`/api/books/:id/toc` and
 * `/toc/flat`) return a bare JSON array, not the `{items, total, limit, offset}`
 * envelope the paginated collections use. A helper for them must not assume
 * `.items` exists.
 */
