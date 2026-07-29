import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { BookIdParamDto } from '../books/books.dto';
import { BooksService } from '../books/books.service';
import { ApiErrorDto, ValidationErrorDto } from '../common/api-error.dto';
import {
  TocEntryDetailDto,
  TocFlatDto,
  TocTreeDto,
  TocUciParamDto,
} from './toc.dto';
import { TocService } from './toc.service';

@ApiTags('toc')
@Controller('toc')
export class TocController {
  constructor(private readonly toc: TocService) {}

  @Get(':uci')
  @ApiOperation({
    summary: 'Get a TOC entry',
    description:
      'The entry with its enclosing chapter and, for a chapter, the fatwa titles it contains.',
  })
  @ZodResponse({
    status: 200,
    description: 'The entry, with parent and children',
    type: TocEntryDetailDto,
  })
  @ApiNotFoundResponse({ description: 'No such TOC entry', type: ApiErrorDto })
  @ApiBadRequestResponse({
    description: 'Not a TOC UCI — a book or page UCI is rejected here',
    type: ValidationErrorDto,
  })
  findOne(@Param() params: TocUciParamDto) {
    return this.toc.findByUci(params.uci);
  }
}

/**
 * Book-scoped TOC routes. Nested and flat are separate operations rather than
 * one endpoint behind `?flat=true` because a single operation can only declare
 * one response schema, and a `oneOf` between a tree and a list would push the
 * branch onto every client.
 */
@ApiTags('toc')
@Controller('books/:bookId/toc')
export class BookTocController {
  constructor(
    private readonly toc: TocService,
    private readonly books: BooksService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "Get a book's table of contents",
    description:
      'Chapters in reading order, each with its fatwa titles nested underneath. Returned whole — the largest book has 2,067 entries and the payload is titles only.',
  })
  @ZodResponse({
    status: 200,
    description: 'The TOC as a two-level tree',
    type: TocTreeDto,
  })
  @ApiNotFoundResponse({ description: 'No such book', type: ApiErrorDto })
  async tree(@Param() params: BookIdParamDto) {
    const bookUci = await this.books.resolveBookUci(params.bookId);
    return this.toc.treeByBook(bookUci);
  }

  @Get('flat')
  @ApiOperation({
    summary: "Get a book's table of contents as a flat list",
    description:
      'The same entries in reading order without nesting, for clients that would rather walk the list than the tree. Use `level` and `parentUci` to recover the hierarchy.',
  })
  @ZodResponse({
    status: 200,
    description: 'The TOC in reading order',
    type: TocFlatDto,
  })
  @ApiNotFoundResponse({ description: 'No such book', type: ApiErrorDto })
  async flat(@Param() params: BookIdParamDto) {
    const bookUci = await this.books.resolveBookUci(params.bookId);
    return this.toc.listByBook(bookUci);
  }
}
