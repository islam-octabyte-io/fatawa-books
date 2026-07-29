import { Module } from '@nestjs/common';

import { BooksModule } from '../books/books.module';
import { BookPagesController, PagesController } from './pages.controller';
import { PagesService } from './pages.service';

/** `BooksModule` is imported for `resolveBookUci`, not for its routes. */
@Module({
  imports: [BooksModule],
  controllers: [PagesController, BookPagesController],
  providers: [PagesService],
})
export class PagesModule {}
