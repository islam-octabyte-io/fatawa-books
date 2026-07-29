import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq, type SQL } from 'drizzle-orm';

import type { Pagination } from '../common/pagination';
import { DRIZZLE } from '../db/drizzle.constants';
import type { Database } from '../db/drizzle.module';
import { books, pages, tocEntries } from '../db/schema';
import { BOOK_UCI } from '../db/uci';

@Injectable()
export class BooksService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Catalogue order is `books.number`, which the schema documents as doubling
   * as the browse order — there is deliberately no separate sort column.
   */
  async list({ limit, offset }: Pagination) {
    const [items, total] = await Promise.all([
      this.db
        .select()
        .from(books)
        .orderBy(asc(books.number))
        .limit(limit)
        .offset(offset),
      this.db.$count(books),
    ]);

    return { items, total, limit, offset };
  }

  async findOne(bookId: string) {
    const book = await this.findByIdOrFail(bookId);

    const [pageCount, tocEntryCount] = await Promise.all([
      this.db.$count(pages, eq(pages.bookUci, book.uci)),
      this.db.$count(tocEntries, eq(tocEntries.bookUci, book.uci)),
    ]);

    return { ...book, pageCount, tocEntryCount };
  }

  /**
   * Turns either accepted book identifier into the UCI that the `pages` and
   * `toc_entries` foreign keys are expressed in. Exported through
   * `BooksModule` because every `/books/:bookId/*` sub-resource needs it.
   */
  async resolveBookUci(bookId: string): Promise<string> {
    return (await this.findByIdOrFail(bookId)).uci;
  }

  private async findByIdOrFail(bookId: string) {
    const [book] = await this.db
      .select()
      .from(books)
      .where(BooksService.idFilter(bookId))
      .limit(1);

    if (!book) {
      throw new NotFoundException(`No book matches '${bookId}'`);
    }

    return book;
  }

  /**
   * UCIs are stored uppercase and are shaped `BF<digits>`; slugs are lowercase
   * and always contain a letter after the first two characters, so the two
   * forms can never collide and no precedence rule is needed. Both columns are
   * unique, so either branch is a single index lookup.
   */
  private static idFilter(bookId: string): SQL {
    return BOOK_UCI.test(bookId)
      ? eq(books.uci, bookId.toUpperCase())
      : eq(books.slug, bookId);
  }
}
