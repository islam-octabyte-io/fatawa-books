import { Module } from '@nestjs/common';

import { BooksModule } from '../books/books.module';
import { BookTocController, TocController } from './toc.controller';
import { TocService } from './toc.service';

/** `BooksModule` is imported for `resolveBookUci`, not for its routes. */
@Module({
  imports: [BooksModule],
  controllers: [TocController, BookTocController],
  providers: [TocService],
})
export class TocModule {}
