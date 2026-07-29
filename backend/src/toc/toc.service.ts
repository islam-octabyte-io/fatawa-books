import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';

import { DRIZZLE } from '../db/drizzle.constants';
import type { Database } from '../db/drizzle.module';
import { type TocEntry, tocEntries } from '../db/schema';
import { parseCompositeUci } from '../db/uci';

/** A TOC row with its printed-page citation resolved. */
type TocEntryView = TocEntry & { pageNo: number; level: 1 | 2 };

@Injectable()
export class TocService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /**
   * The whole TOC in one response, deliberately unpaginated: the largest book
   * has 2,067 entries and the payload is titles only, so splitting it would
   * just make a client reassemble the tree across requests.
   */
  async listByBook(bookUci: string): Promise<TocEntryView[]> {
    const rows = await this.db
      .select()
      .from(tocEntries)
      .where(eq(tocEntries.bookUci, bookUci))
      .orderBy(asc(tocEntries.numberInBook));

    return rows.map(toView);
  }

  /**
   * Nests the flat list into chapters. Safe in a single forward pass because
   * the ingest resolves every level-2 parent to the nearest *preceding* level-1
   * in the same book, so a parent is always already in the map.
   */
  async treeByBook(bookUci: string) {
    const chapters: (TocEntryView & { children: TocEntryView[] })[] = [];
    const byUci = new Map<string, (typeof chapters)[number]>();

    for (const entry of await this.listByBook(bookUci)) {
      if (entry.level === 1) {
        const chapter = { ...entry, children: [] };
        byUci.set(entry.uci, chapter);
        chapters.push(chapter);
        continue;
      }

      // `parentUci` is non-null for level 2 by CHECK constraint, and same-book
      // by construction — but don't drop a row silently if that ever slips.
      const parent = entry.parentUci ? byUci.get(entry.parentUci) : undefined;

      if (!parent) {
        throw new Error(
          `TOC entry ${entry.uci} has unresolvable parent '${entry.parentUci}'`,
        );
      }

      parent.children.push(entry);
    }

    return chapters;
  }

  async findByUci(uci: string) {
    const entry = await this.db.query.tocEntries.findFirst({
      where: eq(tocEntries.uci, uci.toUpperCase()),
      with: {
        // `parent`/`children` are the two halves of the `toc_entry_hierarchy`
        // self-relation declared in `../db/schema/relations.ts`.
        parent: true,
        children: { orderBy: [asc(tocEntries.numberInBook)] },
      },
    });

    if (!entry) {
      throw new NotFoundException(`No TOC entry has UCI '${uci}'`);
    }

    const { parent, children, ...row } = entry;

    return {
      ...toView(row),
      parent: parent ? toView(parent) : null,
      children: children.map(toView),
    };
  }
}

/**
 * Derives the printed page number from `pageUci` instead of joining `pages`.
 * A `BP` UCI ends in the zero-padded printed page, which is exactly why the
 * identifiers are composite — see the registry docblock in
 * `../db/schema/books.ts`.
 *
 * Throws rather than returning null: a row that fails to parse would have had
 * to violate the `pages_uci_check` CHECK, so it is a corrupted database, not a
 * request the caller can fix.
 */
function toView(entry: TocEntry): TocEntryView {
  const parsed = parseCompositeUci(entry.pageUci);

  if (!parsed) {
    throw new Error(
      `TOC entry ${entry.uci} references malformed page UCI '${entry.pageUci}'`,
    );
  }

  if (entry.level !== 1 && entry.level !== 2) {
    throw new Error(
      `TOC entry ${entry.uci} has out-of-range level ${entry.level}`,
    );
  }

  return { ...entry, level: entry.level, pageNo: parsed.position };
}
