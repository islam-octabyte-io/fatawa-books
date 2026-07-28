import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Throwaway table proving the migrate → query → validate → serialize path,
 * exercised by `HealthController`. The real domain schema (`books`, `pages`,
 * `toc_entries`) now lives alongside it in this directory, so this table and
 * the `/pings` endpoints can be deleted whenever the smoke test is no longer
 * wanted.
 *
 * Not a UCI entity: it holds no content, so it keeps its serial id.
 *
 * Column names are spelled out explicitly so a `casing` mismatch between the
 * runtime `drizzle()` call and `drizzle.config.ts` cannot silently diverge.
 */
export const pings = pgTable('pings', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Ping = typeof pings.$inferSelect;
export type NewPing = typeof pings.$inferInsert;
