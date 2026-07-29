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

/** Builds the `?limit=&offset=` suffix, omitting either half when unset. */
function paginationQuery(params: { limit?: number; offset?: number }): string {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  return query.size > 0 ? `?${query}` : '';
}

/**
 * The catalogue. `limit` is capped at 100 by the backend; the whole corpus is 23
 * books, so one page covers it today.
 */
export function listBooks(
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedBooks> {
  return apiFetch<PaginatedBooks>(`/api/books${paginationQuery(params)}`);
}

/** `bookId` accepts either the UCI (`BF11`) or the slug (`fatawa-islamia-jild-2`). */
export function getBook(bookId: string): Promise<BookDetail> {
  return apiFetch<BookDetail>(`/api/books/${encodeURIComponent(bookId)}`);
}

/**
 * A book's pages, without their HTML — the listing carries only `pageNo` and
 * `hasFootnotes`, which is why it is cheap enough to ask for a book's first
 * page just to know where reading starts.
 *
 * `limit` is capped at 100 by the backend and the largest book has 2,029 pages,
 * so this is genuinely paginated, unlike the catalogue.
 */
export function listBookPages(
  bookId: string,
  params: { limit?: number; offset?: number } = {},
): Promise<PaginatedPageSummaries> {
  return apiFetch<PaginatedPageSummaries>(
    `/api/books/${encodeURIComponent(bookId)}/pages${paginationQuery(params)}`,
  );
}

/**
 * One page, by book and *printed* page number — not an index. Books start
 * anywhere from page 1 to 179 and may skip numbers, so this 404s for a page the
 * book does not have rather than clamping to a neighbour.
 */
export function getPage(bookId: string, pageNo: number): Promise<PageDetail> {
  return apiFetch<PageDetail>(
    `/api/books/${encodeURIComponent(bookId)}/pages/${pageNo}`,
  );
}

/** The same page, addressed by its UCI (`BP110026`). */
export function getPageByUci(uci: string): Promise<PageDetail> {
  return apiFetch<PageDetail>(`/api/pages/${encodeURIComponent(uci)}`);
}

/*
 * The TOC endpoints return a BARE JSON ARRAY, not the `{items, total, limit,
 * offset}` envelope the paginated collections use — the tree is deliberately
 * unpaginated because it is titles only, at most 2,067 of them for one book.
 * The return types below say so; nothing here may reach for `.items`.
 */

/** The two-level tree: chapters, each with its fatwa titles nested underneath. */
export function getBookToc(bookId: string): Promise<TocChapter[]> {
  return apiFetch<TocChapter[]>(
    `/api/books/${encodeURIComponent(bookId)}/toc`,
  );
}

/** The same entries in reading order with no nesting, for flat lists and counts. */
export function getBookTocFlat(bookId: string): Promise<TocEntry[]> {
  return apiFetch<TocEntry[]>(
    `/api/books/${encodeURIComponent(bookId)}/toc/flat`,
  );
}

/** One TOC entry, by UCI (`BT110001`), with its parent and children resolved. */
export function getTocEntry(uci: string): Promise<TocEntryDetail> {
  return apiFetch<TocEntryDetail>(`/api/toc/${encodeURIComponent(uci)}`);
}
