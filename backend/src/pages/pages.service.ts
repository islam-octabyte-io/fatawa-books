import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm';

import type { Pagination } from '../common/pagination';
import { DRIZZLE } from '../db/drizzle.constants';
import type { Database } from '../db/drizzle.module';
import { type Page, pages } from '../db/schema';

@Injectable()
export class PagesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * Summaries only. Ordering and filtering both ride the existing
   * `pages_book_page_unique` btree, so no extra index is needed.
   */
  async listByBook(bookUci: string, { limit, offset }: Pagination) {
    const [items, total] = await Promise.all([
      this.db
        .select({
          uci: pages.uci,
          pageNo: pages.pageNo,
          // Computed in SQL so the footnote text never leaves the database for
          // a listing that isn't going to render it.
          hasFootnotes: sql<boolean>`(${pages.footnotes} IS NOT NULL AND ${pages.footnotes} <> '')`,
        })
        .from(pages)
        .where(eq(pages.bookUci, bookUci))
        .orderBy(asc(pages.pageNo))
        .limit(limit)
        .offset(offset),
      this.db.$count(pages, eq(pages.bookUci, bookUci)),
    ]);

    return { items, total, limit, offset };
  }

  async findByUci(uci: string) {
    const [page] = await this.db
      .select()
      .from(pages)
      .where(eq(pages.uci, uci.toUpperCase()))
      .limit(1);

    if (!page) {
      throw new NotFoundException(`No page has UCI '${uci}'`);
    }

    return this.withNeighbours(page);
  }

  async findByBookAndPageNo(bookUci: string, pageNo: number) {
    const [page] = await this.db
      .select()
      .from(pages)
      .where(and(eq(pages.bookUci, bookUci), eq(pages.pageNo, pageNo)))
      .limit(1);

    if (!page) {
      throw new NotFoundException(
        `Book '${bookUci}' has no printed page ${pageNo}`,
      );
    }

    return this.withNeighbours(page);
  }

  /**
   * Neighbours are queried rather than computed. `page_no` is the source
   * `Book.ID` — a real printed page number — so it is not guaranteed to be
   * gapless and `pageNo ± 1` may not exist even mid-book.
   */
  private async withNeighbours(page: Page) {
    const [prev, next] = await Promise.all([
      this.db
        .select({ uci: pages.uci })
        .from(pages)
        .where(
          and(eq(pages.bookUci, page.bookUci), lt(pages.pageNo, page.pageNo)),
        )
        .orderBy(desc(pages.pageNo))
        .limit(1),
      this.db
        .select({ uci: pages.uci })
        .from(pages)
        .where(
          and(eq(pages.bookUci, page.bookUci), gt(pages.pageNo, page.pageNo)),
        )
        .orderBy(asc(pages.pageNo))
        .limit(1),
    ]);

    return {
      ...page,
      prevUci: prev[0]?.uci ?? null,
      nextUci: next[0]?.uci ?? null,
    };
  }
}
