/**
 * Barrel for `drizzle()`'s `{ schema }` and for `drizzle.config.ts`. A table or
 * relation that isn't re-exported here is invisible to both migration
 * generation and `db.query.*`.
 *
 * The corpus `B` UCI registry — every prefix, its entity, its numbering, and
 * the remaining free letters — is documented in `./books.ts` and nowhere else.
 */

export * from './books';
export * from './pages';
export * from './relations';
export * from './toc-entries';
