import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { paginatedSchema } from '../common/pagination';
import { PAGE_UCI, POSITION_WIDTH } from '../db/uci';

/** The frozen per-book ceiling enforced by the `pages_page_no_check` CHECK. */
const MAX_PAGE_NO = 10 ** POSITION_WIDTH - 1;

const pageNoMeta = {
  description:
    'The REAL PRINTED page number, not a 1-based offset — books in this corpus start anywhere from page 1 to page 179. This is the citation and half of the UCI.',
  example: 26,
};

/**
 * Listing shape for a book's page index. `html` is deliberately absent: this
 * endpoint is navigation, and 12,471 HTML bodies is not a payload. Fetch
 * content one page at a time via `PageDetail`.
 */
export const PageSummarySchema = z
  .object({
    uci: z.string().meta({ example: 'BP110026' }),
    pageNo: z.number().int().meta(pageNoMeta),
    /** Lets a reader show a footnote affordance without fetching the block. */
    hasFootnotes: z.boolean(),
  })
  .meta({ id: 'PageSummary' });

export const PaginatedPageSummariesSchema = paginatedSchema(
  PageSummarySchema,
  'PaginatedPageSummaries',
);

export class PaginatedPageSummariesDto extends createZodDto(
  PaginatedPageSummariesSchema,
) {}

export const PageDetailSchema = z
  .object({
    uci: z.string().meta({
      description:
        'Composite: `BP` + book number + the printed page zero-padded to 4 digits. Parse right-to-left — the last four digits are always the page.',
      example: 'BP110026',
    }),
    bookUci: z.string().meta({ example: 'BF11' }),
    pageNo: z.number().int().meta(pageNoMeta),
    html: z.string().meta({
      description: [
        'The page body as an HTML fragment. Presentation is encoded as a fixed class vocabulary:',
        '`lu` `la` `le` `lx` (language: Urdu, Arabic, English, unspecified),',
        '`b` `i` `u` `hl` (bold, italic, underline, highlight),',
        '`fn` (footnote marker), `tc` `tj` `ta0` `ta3` (alignment), `s12`–`s26` (font size in pt).',
        'Note `u` (underline) and `lu` (Urdu) are distinct tokens.',
        'WARNING: the markup is stored exactly as it came from the source — 1,264 pages contain unbalanced `<span>` tags, so parse defensively rather than assuming a well-formed tree.',
      ].join(' '),
    }),
    footnotes: z
      .string()
      .nullable()
      .meta({ description: "The page's footnote block; may be absent." }),
    /**
     * Queried, not derived: printed page numbers come from the source and are
     * not guaranteed gapless, so `pageNo ± 1` is not a valid neighbour.
     */
    prevUci: z
      .string()
      .nullable()
      .meta({ description: 'Previous page in this book, or null at the start.' }),
    nextUci: z
      .string()
      .nullable()
      .meta({ description: 'Next page in this book, or null at the end.' }),
  })
  .meta({ id: 'PageDetail' });

export class PageDetailDto extends createZodDto(PageDetailSchema) {}

/**
 * Pages are addressable by UCI only — unlike a book, a page has no slug. The
 * regex rejects a wrong-prefix identifier (`BF1`, `BT10001`) as a 400 rather
 * than letting it fall through to a misleading 404.
 */
export const PageUciParamSchema = z.object({
  uci: z
    .string()
    .regex(PAGE_UCI, 'Must be a page UCI, e.g. BP110026')
    .meta({ example: 'BP110026' }),
});

export class PageUciParamDto extends createZodDto(PageUciParamSchema) {}

export const BookPageNoParamSchema = z.object({
  bookId: z.string().min(1).meta({
    description: 'Book UCI (`BF11`) or slug (`fatawa-islamia-jild-2`).',
    example: 'BF11',
  }),
  pageNo: z.coerce.number().int().min(1).max(MAX_PAGE_NO).meta(pageNoMeta),
});

export class BookPageNoParamDto extends createZodDto(BookPageNoParamSchema) {}
