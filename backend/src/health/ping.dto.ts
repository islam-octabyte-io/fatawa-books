import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// `.meta({ id })` names the generated OpenAPI component; without it the schema is
// inlined anonymously.
export const CreatePingSchema = z
  .object({ message: z.string().min(1).max(280) })
  .meta({ id: 'CreatePing' });

export class CreatePingDto extends createZodDto(CreatePingSchema) {}

export const PingSchema = z
  .object({
    id: z.number().int(),
    message: z.string(),
    // Drizzle hands back a JS `Date` for `timestamp` columns, but a bare
    // `z.date()` makes Swagger's metadata factory throw ("Date cannot be
    // represented in JSON Schema"), and `.transform()` fails the same check.
    // Normalising to an ISO string up front keeps both the wire format and the
    // generated OpenAPI schema honest, and still accepts an already-serialised
    // string on the way in.
    createdAt: z.preprocess(
      (value) => (value instanceof Date ? value.toISOString() : value),
      z.iso.datetime(),
    ),
  })
  .meta({ id: 'Ping' });

export class PingDto extends createZodDto(PingSchema) {}
