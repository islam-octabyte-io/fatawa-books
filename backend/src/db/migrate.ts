import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

/**
 * Applies pending migrations without needing the drizzle-kit devDependency, so
 * production images stay lean. `migrationsFolder` resolves against cwd — run this
 * from the backend package root.
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');

  const pool = new Pool({ connectionString: url, max: 1 });
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
  await pool.end();

  console.log('migrations applied');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
