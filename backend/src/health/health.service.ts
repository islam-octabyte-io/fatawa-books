import { Inject, Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DRIZZLE } from '../db/drizzle.constants';
import type { Database } from '../db/drizzle.module';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async check() {
    const db = await this.pingDatabase();

    return {
      status: db === 'up' ? ('ok' as const) : ('error' as const),
      uptime: Math.floor(process.uptime()),
      db,
    };
  }

  /**
   * `select 1` rather than a table read: it proves the pool can hand out a live
   * connection without coupling the probe to the schema, so a health check
   * keeps working across migrations.
   */
  private async pingDatabase(): Promise<'up' | 'down'> {
    try {
      await this.db.execute(sql`select 1`);
      return 'up';
    } catch (error) {
      // Logged here because the response deliberately says only `down` — a
      // health endpoint is unauthenticated and shouldn't leak connection
      // details, but an operator still needs the cause.
      this.logger.error(
        'Database health check failed',
        error instanceof Error ? error.stack : String(error),
      );
      return 'down';
    }
  }
}
