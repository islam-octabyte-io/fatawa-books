import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { DRIZZLE, PG_POOL } from './drizzle.constants';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema> & { $client: Pool };

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Pool({ connectionString: config.getOrThrow<string>('DATABASE_URL') }),
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL, ConfigService],
      useFactory: (pool: Pool, config: ConfigService): Database =>
        // `schema` is required here — without it `db.query.*` resolves to a
        // DrizzleTypeError and relational queries won't compile.
        drizzle(pool, {
          schema,
          casing: 'snake_case',
          logger: config.get<string>('NODE_ENV') === 'development',
        }),
    },
  ],
  exports: [DRIZZLE, PG_POOL],
})
export class DrizzleModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  /**
   * `OnApplicationShutdown` rather than `OnModuleDestroy` so the pool closes
   * after the HTTP server stops accepting requests, not during. Requires
   * `app.enableShutdownHooks()` in main.ts or this never fires on SIGTERM.
   */
  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
