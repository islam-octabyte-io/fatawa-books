import { Module } from '@nestjs/common';

import { BooksController } from './books.controller';
import { BooksService } from './books.service';

/**
 * `DrizzleModule` is `@Global()`, so nothing needs importing to reach
 * `DRIZZLE`.
 *
 * `BooksService` is exported because `PagesModule` and `TocModule` both own
 * routes nested under `/books/:bookId` and resolve that param through
 * `resolveBookUci`.
 */
@Module({
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
