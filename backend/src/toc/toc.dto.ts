import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TOC_UCI } from '../db/uci';

/**
 * A book's table of contents is a two-level tree: level 1 is a chapter, level 2
 * is an individual fatwa title. The `toc_entries_parent_check` constraint makes
 * that exact — a level-1 entry always has a null parent and a level-2 entry
 * always has one — so no deeper nesting is representable.
 */
const tocEntryShape = {
  uci: z.string().meta({
    description:
      'Composite: `BT` + book number + the entry number zero-padded to 4 digits.',
    example: 'BT110001',
  }),
  bookUci: z.string().meta({ example: 'BF11' }),
  numberInBook: z
    .number()
    .int()
    .meta({ description: 'Reading order within the book, 1-based.' }),
  level: z
    .union([z.literal(1), z.literal(2)])
    .meta({ description: '1 = chapter, 2 = fatwa title.' }),
  parentUci: z.string().nullable().meta({
    description: "The enclosing chapter's UCI; null for a chapter itself.",
  }),
  title: z.string().meta({
    description:
      "Heading text. A source row with a blank heading is stored as '—' rather than being given invented text.",
  }),
  pageUci: z.string().meta({
    description: 'The page this entry points at.',
    example: 'BP110026',
  }),
  pageNo: z.number().int().meta({
    description:
      'The printed page number, read straight out of `pageUci` — a citation needs no extra request.',
    example: 26,
  }),
};

export const TocEntrySchema = z.object(tocEntryShape).meta({ id: 'TocEntry' });

/** A level-1 chapter with its fatwa titles nested underneath, in order. */
export const TocChapterSchema = z
  .object({
    ...tocEntryShape,
    children: z.array(TocEntrySchema),
  })
  .meta({ id: 'TocChapter' });

/**
 * The two list responses are their own named schemas rather than
 * `@ZodResponse({ type: [TocChapterDto] })`. With the array form, nestjs-zod
 * renames the component to the schema's `.meta({ id })` but leaves the `$ref`
 * pointing at the DTO class name, which leaves a dangling reference in the
 * generated document. Naming the array schema keeps the reference resolvable.
 */
export const TocTreeSchema = z.array(TocChapterSchema).meta({ id: 'TocTree' });

export class TocTreeDto extends createZodDto(TocTreeSchema) {}

export const TocFlatSchema = z.array(TocEntrySchema).meta({ id: 'TocFlat' });

export class TocFlatDto extends createZodDto(TocFlatSchema) {}

export const TocEntryDetailSchema = z
  .object({
    ...tocEntryShape,
    /** The enclosing chapter, or null when this entry *is* a chapter. */
    parent: TocEntrySchema.nullable(),
    /** Fatwa titles under this chapter; always empty for a level-2 entry. */
    children: z.array(TocEntrySchema),
  })
  .meta({ id: 'TocEntryDetail' });

export class TocEntryDetailDto extends createZodDto(TocEntryDetailSchema) {}

/**
 * TOC entries are addressable by UCI only. The regex turns a wrong-prefix
 * identifier into a 400 instead of a confusing 404.
 */
export const TocUciParamSchema = z.object({
  uci: z
    .string()
    .regex(TOC_UCI, 'Must be a TOC entry UCI, e.g. BT110001')
    .meta({ example: 'BT110001' }),
});

export class TocUciParamDto extends createZodDto(TocUciParamSchema) {}
