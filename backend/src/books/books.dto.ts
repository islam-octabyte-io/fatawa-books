import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { paginatedSchema } from '../common/pagination';

/**
 * The shared columns live in a plain shape object rather than being pulled in
 * with `BookSchema.extend()`, because `.extend()` carries the parent's
 * `.meta({ id })` across and both schemas would then claim the `Book`
 * component name.
 */
const bookShape = {
  uci: z.string().meta({
    description:
      'Immutable identifier, `BF<number>`. Frozen on publish — never renamed or renumbered.',
    example: 'BF11',
  }),
  number: z.number().int().meta({
    description:
      'Catalogue order, which is also the browse order. Volume sets are consecutive.',
    example: 11,
  }),
  slug: z.string().meta({
    description: 'Human-readable handle. Renameable — the UCI is not.',
    example: 'fatawa-islamia-jild-2',
  }),
  title: z.string().meta({ description: 'Title as printed, in Urdu.' }),
  writer: z.string().nullable().meta({
    description:
      'Attribution verbatim from the source. Free text: multi-author books put several names in one string, and one scholar may be spelled differently across books. Not a stable key for grouping.',
  }),
  publisher: z.string().nullable(),
};

export const BookSchema = z.object(bookShape).meta({ id: 'Book' });

export const BookDetailSchema = z
  .object({
    ...bookShape,
    /** Rows in `pages` for this book — not the printed page range. */
    pageCount: z.number().int().nonnegative(),
    /** Chapters plus fatwa titles, both levels counted together. */
    tocEntryCount: z.number().int().nonnegative(),
  })
  .meta({ id: 'BookDetail' });

export class BookDetailDto extends createZodDto(BookDetailSchema) {}

export const PaginatedBooksSchema = paginatedSchema(
  BookSchema,
  'PaginatedBooks',
);

export class PaginatedBooksDto extends createZodDto(PaginatedBooksSchema) {}

/**
 * `bookId` is the one polymorphic path param in the API: a book is addressable
 * by its UCI or by its slug. Validation is a non-empty string because the two
 * forms are told apart by `BOOK_UCI` in `BooksService`, and a value matching
 * neither is a 404 (no such book) rather than a 400 (malformed).
 */
export const BookIdParamSchema = z.object({
  bookId: z.string().min(1).meta({
    description: 'Book UCI (`BF11`) or slug (`fatawa-islamia-jild-2`).',
    example: 'BF11',
  }),
});

export class BookIdParamDto extends createZodDto(BookIdParamSchema) {}
