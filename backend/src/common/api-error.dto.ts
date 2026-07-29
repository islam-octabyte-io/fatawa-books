import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * The two error bodies this API actually emits. Both are documented so the
 * generated OpenAPI declares its failure responses instead of leaving them
 * implicit — clients otherwise have to guess the shape.
 */

/**
 * Nest's built-in `HttpException` body, as produced by `NotFoundException` and
 * `ServiceUnavailableException`.
 */
export const ApiErrorSchema = z
  .object({
    statusCode: z.number().int(),
    message: z.string(),
    error: z.string().optional(),
  })
  .meta({ id: 'ApiError' });

export class ApiErrorDto extends createZodDto(ApiErrorSchema) {}

/**
 * nestjs-zod's `ZodValidationException` body. Distinct from the above: the
 * message is always the literal `Validation failed` and the detail lives in
 * `errors`, which holds raw Zod issues.
 */
export const ValidationErrorSchema = z
  .object({
    statusCode: z.literal(400),
    message: z.literal('Validation failed'),
    errors: z.array(z.unknown()).optional(),
  })
  .meta({ id: 'ValidationError' });

export class ValidationErrorDto extends createZodDto(ValidationErrorSchema) {}
