import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Throwaway table proving the migrate → query → validate → serialize path.
 * The real fatwa domain schema (authors / books / volumes / pages / toc) lands
 * in a follow-up task alongside the SQLite ingest.
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
