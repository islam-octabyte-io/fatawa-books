import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { desc } from 'drizzle-orm';
import { ZodResponse } from 'nestjs-zod';

import { DRIZZLE } from '../db/drizzle.constants';
import type { Database } from '../db/drizzle.module';
import { pings } from '../db/schema';
import { CreatePingDto, PingDto } from './ping.dto';

@ApiTags('health')
@Controller('pings')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  @Get()
  @ZodResponse({ status: 200, description: 'List pings', type: [PingDto] })
  async list() {
    return this.db.select().from(pings).orderBy(desc(pings.id)).limit(20);
  }

  @Post()
  @ZodResponse({ status: 201, description: 'Create ping', type: PingDto })
  async create(@Body() body: CreatePingDto) {
    const [row] = await this.db
      .insert(pings)
      .values({ message: body.message })
      .returning();

    return row;
  }

  /** Exercises the relational query builder, which only works when `drizzle()` got `{ schema }`. */
  @Get('relational')
  async relational() {
    return this.db.query.pings.findMany({ limit: 5 });
  }
}
