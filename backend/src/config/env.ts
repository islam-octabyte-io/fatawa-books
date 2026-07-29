import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.url(),
  /**
   * Allowed browser origins: `*` for any, or a comma-separated list. The
   * frontend workspace is a placeholder today but will be served from a
   * different origin, and the API is read-only, so `*` is a sane default.
   */
  CORS_ORIGIN: z.string().min(1).default('*'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Passed to `ConfigModule.forRoot({ validate })`. Throwing here aborts bootstrap,
 * so a bad environment fails fast with a readable message instead of surfacing as
 * a connection error later. The returned object is what `ConfigService.get` reads
 * first, so `z.coerce` results survive — `get<number>('PORT')` is a real number.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}
