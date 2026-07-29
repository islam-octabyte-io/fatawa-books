import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { HealthDto } from './health.dto';
import { HealthService } from './health.service';

/**
 * Excluded from the `/api` global prefix in `main.ts`, so this stays at
 * `/health` where orchestrators and uptime checks expect it.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness and dependency check',
    description:
      'Returns 200 when the process is up and Postgres answers, 503 otherwise. The body is the same shape either way.',
  })
  @ZodResponse({
    status: 200,
    description: 'Everything is reachable',
    type: HealthDto,
  })
  // `.Output` rather than `HealthDto`: `@ZodResponse` above documents the
  // output variant of the schema, which nestjs-zod names `Health_Output`.
  // Passing the DTO itself here would register the input variant too and leave
  // two near-identical `Health` components in the document.
  @ApiServiceUnavailableResponse({
    description: 'A dependency is unreachable',
    type: HealthDto.Output,
  })
  async check() {
    const result = await this.health.check();

    // The status code, not just the body, has to carry the failure — probes
    // routinely look at nothing else.
    if (result.status !== 'ok') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }
}
