import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import {
  books,
  pages,
  tocEntries,
  type NewBook,
  type NewPage,
  type NewTocEntry,
} from '../schema/index';
import { buildBookUci, buildPageUci, buildTocUci } from '../uci';
import { cleanFootnotes, cleanTitle, rewritePageHtml } from './html';
import { MANIFEST } from './manifest';

/**
 * Ingests `data-collection/*.db` into `books` / `pages` / `toc_entries`.
 *
 * Idempotent by truncate-and-rebuild, which is only safe because every UCI is
 * COMPUTED from the manifest number plus a source position — no identifier
 * depends on insert order or a generated sequence. Re-running produces byte
 * identical rows.
 *
 * Reads with `node:sqlite` (built into Node 22.5+) so ingesting 23 SQLite files
 * needs no extra dependency.
 *
 * Run with:  pnpm db:seed
 */

/** Postgres caps a statement at 65535 bind parameters; `pages` binds 5/row. */
const CHUNK = 400;

type SourceMetadata = { title: string; writer: string | null; publisher: string | null };

/** `متفرق` = "various" — a real value in the anthology, kept verbatim. */
function metaValue(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readMetadata(db: DatabaseSync, file: string): SourceMetadata {
  const rows = db
    .prepare('SELECT fieldName, fieldValue FROM metadata')
    .all() as Array<{ fieldName: string; fieldValue: string | null }>;

  const map = new Map(rows.map((r) => [r.fieldName, r.fieldValue]));
  const title = metaValue(map.get('Book Name'));
  if (title === null) throw new Error(`${file}: metadata has no "Book Name"`);

  return {
    title,
    writer: metaValue(map.get('Writer')),
    publisher: metaValue(map.get('Publisher')),
  };
}

type BookResult = {
  book: NewBook;
  pageRows: NewPage[];
  tocRows: NewTocEntry[];
  emptyTitles: number;
};

function readBook(dir: string, entry: (typeof MANIFEST)[number]): BookResult {
  const path = resolve(dir, entry.file);
  const db = new DatabaseSync(path, { readOnly: true });

  try {
    const meta = readMetadata(db, entry.file);
    const bookUci = buildBookUci(entry.number);

    const pageRows: NewPage[] = [];
    const knownPages = new Set<number>();
    for (const row of db
      .prepare('SELECT ID, txt, fnotes FROM Book ORDER BY ID')
      .all() as Array<{ ID: number; txt: string | null; fnotes: string | null }>) {
      knownPages.add(row.ID);
      pageRows.push({
        uci: buildPageUci(entry.number, row.ID),
        bookUci,
        pageNo: row.ID,
        html: rewritePageHtml(row.txt ?? ''),
        footnotes: cleanFootnotes(row.fnotes),
      });
    }

    const tocRows: NewTocEntry[] = [];
    let emptyTitles = 0;
    // Nearest preceding h1 within this book, in source order — verified across
    // all 23 files: every book's first TOC entry is an h1, so an h2 always has
    // a parent and `toc_entries_parent_check` holds by construction.
    let lastH1: string | null = null;

    for (const row of db
      .prepare('SELECT ID, pageID, txt, headingType FROM tableOfContents ORDER BY ID')
      .all() as Array<{
      ID: number;
      pageID: number;
      txt: string | null;
      headingType: string | null;
    }>) {
      if (!knownPages.has(row.pageID)) {
        throw new Error(
          `${entry.file}: TOC entry ${row.ID} points at missing page ${row.pageID}`,
        );
      }

      const heading = row.headingType?.trim().toLowerCase();
      if (heading !== 'h1' && heading !== 'h2') {
        throw new Error(
          `${entry.file}: TOC entry ${row.ID} has unexpected headingType ${JSON.stringify(row.headingType)}`,
        );
      }

      const level = heading === 'h1' ? 1 : 2;
      const uci = buildTocUci(entry.number, row.ID);
      if (level === 1) lastH1 = uci;

      if (level === 2 && lastH1 === null) {
        throw new Error(`${entry.file}: TOC entry ${row.ID} is an h2 with no preceding h1`);
      }

      // A blank title would render as an unclickable gap; surface the count
      // rather than inventing text for it.
      const title = cleanTitle(row.txt ?? '');
      if (title.length === 0) emptyTitles++;

      tocRows.push({
        uci,
        bookUci,
        numberInBook: row.ID,
        level,
        parentUci: level === 2 ? lastH1 : null,
        title: title.length > 0 ? title : '—',
        pageUci: buildPageUci(entry.number, row.pageID),
      });
    }

    return {
      book: {
        uci: bookUci,
        number: entry.number,
        slug: entry.slug,
        title: meta.title,
        writer: meta.writer,
        publisher: meta.publisher,
      },
      pageRows,
      tocRows,
      emptyTitles,
    };
  } finally {
    db.close();
  }
}

function chunk<T>(rows: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  // Resolves against cwd, matching `migrate.ts` — run from the backend package
  // root. `import.meta` is unavailable because this package compiles to CJS.
  const dir = resolve(process.cwd(), '../data-collection');
  if (!existsSync(dir)) {
    throw new Error(`data-collection not found at ${dir} — run this from backend/`);
  }

  // Validate the whole manifest before opening a transaction, so a typo fails
  // before anything is truncated.
  const numbers = new Set<number>();
  const slugs = new Set<string>();
  for (const e of MANIFEST) {
    if (!existsSync(resolve(dir, e.file))) throw new Error(`missing source file: ${e.file}`);
    if (numbers.has(e.number)) throw new Error(`duplicate manifest number ${e.number}`);
    if (slugs.has(e.slug)) throw new Error(`duplicate manifest slug ${e.slug}`);
    numbers.add(e.number);
    slugs.add(e.slug);
  }

  console.log(`reading ${MANIFEST.length} source files from ${dir}`);
  const results = MANIFEST.map((e) => readBook(dir, e));

  let totalPages = 0;
  let totalToc = 0;
  let totalEmptyTitles = 0;
  for (const [i, r] of results.entries()) {
    totalPages += r.pageRows.length;
    totalToc += r.tocRows.length;
    totalEmptyTitles += r.emptyTitles;
    const h1 = r.tocRows.filter((t) => t.level === 1).length;
    console.log(
      `  ${r.book.uci.padEnd(5)} ${String(MANIFEST[i].slug).padEnd(38)} ` +
        `pages=${String(r.pageRows.length).padStart(4)} ` +
        `toc=${String(r.tocRows.length).padStart(4)} (h1=${h1}, h2=${r.tocRows.length - h1})` +
        (r.emptyTitles > 0 ? `  blank-titles=${r.emptyTitles}` : ''),
    );
  }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { casing: 'snake_case' });

  try {
    await db.transaction(async (tx) => {
      // All three at once: they reference each other, so truncating them
      // separately would trip the FKs.
      await tx.execute(sql`TRUNCATE TABLE ${tocEntries}, ${pages}, ${books}`);

      await tx.insert(books).values(results.map((r) => r.book));

      // Pages before TOC — `toc_entries.page_uci` is an FK to `pages.uci`.
      for (const part of chunk(results.flatMap((r) => r.pageRows), CHUNK)) {
        await tx.insert(pages).values(part);
      }
      // Level 1 before level 2, so a child's `parent_uci` FK already resolves.
      const toc = results.flatMap((r) => r.tocRows);
      for (const part of chunk(toc.filter((t) => t.level === 1), CHUNK)) {
        await tx.insert(tocEntries).values(part);
      }
      for (const part of chunk(toc.filter((t) => t.level === 2), CHUNK)) {
        await tx.insert(tocEntries).values(part);
      }
    });

    console.log(
      `\nseeded ${results.length} books, ${totalPages} pages, ${totalToc} toc entries` +
        (totalEmptyTitles > 0 ? ` (${totalEmptyTitles} blank TOC titles → "—")` : ''),
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
