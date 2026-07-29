import { createZodDto } from 'nestjs-zod';
import { z, type ZodType } from 'zod';

/**
 * Offset pagination for the two unbounded collections — the catalogue and a
 * book's page index. A book's TOC is deliberately NOT paginated (see
 * `../toc/toc.service.ts`).
 */

export const DEFAULT_LIMIT = 20;

/**
 * Hard ceiling on `limit`. The heaviest paginated row is a page summary (a UCI
 * and an integer — `html` is never in a list response), so 100 is generous;
 * it exists to stop `?limit=100000` becoming a full-table scan.
 */
export const MAX_LIMIT = 100;

// No `.meta({ id })` here, unlike the response schemas below: a query schema
// becomes OpenAPI *parameters*, not a component, so naming it would register a
// schema component that nothing ever references.
export const PaginationQuerySchema = z.object({
  // `z.coerce` is required: query strings arrive as strings. `.default()`
  // short-circuits before the coercion runs, so an absent param never becomes
  // NaN. Same idiom as `../config/env.ts`.
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_LIMIT)
    .default(DEFAULT_LIMIT)
    .meta({ description: `Rows per response, 1–${MAX_LIMIT}.` }),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .default(0)
    .meta({ description: 'Rows to skip.' }),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

/** Resolved (defaults applied) pagination, as services receive it. */
export type Pagination = z.output<typeof PaginationQuerySchema>;

/**
 * Wraps an item schema in the shared `{ items, total, limit, offset }`
 * envelope.
 *
 * `id` is not optional on purpose: OpenAPI components are keyed by it, so each
 * item type needs its own name (`PaginatedBooks`, `PaginatedPageSummaries`) or
 * the second envelope silently overwrites the first's component.
 */
export function paginatedSchema<T extends ZodType>(items: T, id: string) {
  return z
    .object({
      items: z.array(items),
      /** Total matching rows, ignoring `limit`/`offset`. */
      total: z.number().int().nonnegative(),
      limit: z.number().int(),
      offset: z.number().int(),
    })
    .meta({ id });
}
