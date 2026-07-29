import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HealthSchema = z
  .object({
    status: z.enum(['ok', 'error']).meta({
      description:
        '`ok` only when every dependency below is reachable. Served with 503 when it is `error`, so a probe can ignore the body entirely.',
    }),
    uptime: z
      .number()
      .int()
      .nonnegative()
      .meta({ description: 'Whole seconds since the process started.' }),
    db: z.enum(['up', 'down']).meta({
      description: 'Result of a `select 1` against the Postgres pool.',
    }),
  })
  .meta({ id: 'Health' });

export class HealthDto extends createZodDto(HealthSchema) {}
