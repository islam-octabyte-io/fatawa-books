import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { createZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';

import { validateEnv } from './config/env';
import { DrizzleModule } from './db/drizzle.module';
import { HealthController } from './health/health.controller';

// `strictSchemaDeclaration` turns the pipe's silent pass-through into a thrown
// error when a handler param isn't a ZodDto — otherwise an endpoint can end up
// completely unvalidated with no signal at all.
const AppZodValidationPipe = createZodValidationPipe({
  strictSchemaDeclaration: true,
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
    }),
    DrizzleModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_PIPE, useClass: AppZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
