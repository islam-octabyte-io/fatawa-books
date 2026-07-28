import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Required for DrizzleModule's OnApplicationShutdown hook to close the pool.
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('Fatawa Books API')
    .setVersion('0.1.0')
    .build();

  // nestjs-zod v5 replaced patchNestJsSwagger() with this post-processing step.
  SwaggerModule.setup(
    'docs',
    app,
    cleanupOpenApiDoc(SwaggerModule.createDocument(app, config)),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  new Logger('Bootstrap').log(`Listening on http://localhost:${port}`);
}

void bootstrap();
