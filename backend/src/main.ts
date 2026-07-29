import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import { AppModule } from './app.module';

const DESCRIPTION = [
  'Read API over a corpus of Urdu fatawa books — 23 books, 12,471 pages and 10,744 table-of-contents entries.',
  '',
  '**Identifiers.** Every content row is keyed by a UCI (Unique Content Identifier) that is frozen on publish: never renamed, never renumbered.',
  'Books are `BF<number>`, pages `BP<book><page>` and TOC entries `BT<book><entry>`.',
  'The composite ones parse right-to-left — the last four digits are the position, everything between the prefix and them is the book number, so `BP110026` is book 11, printed page 26.',
  '',
  '**Books accept two forms.** Anywhere `bookId` appears you may pass the UCI (`BF11`) or the slug (`fatawa-islamia-jild-2`). Pages and TOC entries are addressable by UCI only.',
  '',
  '**Page numbers are printed page numbers**, not 1-based offsets: books in this corpus start anywhere from page 1 to page 179, and gaps are possible, so never assume `pageNo` counts from one or that `pageNo + 1` exists. Follow `nextUci`/`prevUci` instead.',
  '',
  '**Read-only.** The corpus is loaded by an offline ingest, so every endpoint is a `GET`. There is no search endpoint: pages carry no plain-text column yet, only presentation-encoded HTML.',
].join('\n');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Required for DrizzleModule's OnApplicationShutdown hook to close the pool.
  app.enableShutdownHooks();

  // `/health` is excluded so probes and orchestrators find it where they
  // expect it.
  // `/docs` needs no exclusion: SwaggerModule defaults `useGlobalPrefix` to
  // false, so the prefix never moves it.
  app.setGlobalPrefix('api', { exclude: ['health'] });

  const corsOrigin = config.getOrThrow<string>('CORS_ORIGIN');
  app.enableCors({
    origin:
      corsOrigin === '*'
        ? '*'
        : corsOrigin.split(',').map((origin) => origin.trim()),
    // Read-only over HTTP; the corpus is populated by `pnpm db:seed`.
    methods: ['GET'],
  });

  // `validateEnv` coerced this to a number, so read it through ConfigService
  // rather than re-parsing process.env.
  const port = config.getOrThrow<number>('PORT');

  const openApiConfig = new DocumentBuilder()
    .setTitle('Fatawa Books API')
    .setDescription(DESCRIPTION)
    .setVersion('0.1.0')
    .addServer(`http://localhost:${port}`, 'Local development')
    .addTag('books', 'The catalogue: browse books and their metadata.')
    .addTag('pages', 'Page bodies, by UCI or by printed page number.')
    .addTag('toc', 'Chapters and fatwa titles, nested or flat.')
    .addTag('health', 'Liveness and dependency checks.')
    .build();

  // nestjs-zod v5 replaced patchNestJsSwagger() with this post-processing step.
  SwaggerModule.setup(
    'docs',
    app,
    cleanupOpenApiDoc(SwaggerModule.createDocument(app, openApiConfig)),
    {
      jsonDocumentUrl: 'docs/json',
      swaggerOptions: { docExpansion: 'list', operationsSorter: 'alpha' },
    },
  );

  await app.listen(port);

  new Logger('Bootstrap').log(
    `Listening on http://localhost:${port} — API under /api, docs at /docs`,
  );
}

void bootstrap();
