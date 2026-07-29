import { Controller, Get, Param, Query } from '@nestjs/common';
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
import { PaginationQueryDto } from '../common/pagination';
import {
  BookPageNoParamDto,
  PageDetailDto,
  PageUciParamDto,
  PaginatedPageSummariesDto,
} from './pages.dto';
import { PagesService } from './pages.service';

@ApiTags('pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get(':uci')
  @ApiOperation({
    summary: 'Get a page by UCI',
    description:
      'Returns the page body plus the UCIs of its neighbours, which is everything a reader needs to page forwards and backwards.',
  })
  @ZodResponse({
    status: 200,
    description: 'The page, with previous/next navigation',
    type: PageDetailDto,
  })
  @ApiNotFoundResponse({ description: 'No such page', type: ApiErrorDto })
  @ApiBadRequestResponse({
    description: 'Not a page UCI — a book or TOC UCI is rejected here',
    type: ValidationErrorDto,
  })
  findOne(@Param() params: PageUciParamDto) {
    return this.pages.findByUci(params.uci);
  }
}

/**
 * Book-scoped page routes. Separate controller rather than extra handlers on
 * `BooksController` so route ownership follows the URL prefix and the page
 * queries stay in `PagesService`.
 */
@ApiTags('pages')
@Controller('books/:bookId/pages')
export class BookPagesController {
  constructor(
    private readonly pages: PagesService,
    private readonly books: BooksService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List a book's pages",
    description:
      'The page index in printed order. Summaries only — `html` is not included; fetch a page individually for its body.',
  })
  @ZodResponse({
    status: 200,
    description: 'A page of the index',
    type: PaginatedPageSummariesDto,
  })
  @ApiNotFoundResponse({ description: 'No such book', type: ApiErrorDto })
  @ApiBadRequestResponse({
    description: '`limit` or `offset` is out of range or not a number',
    type: ValidationErrorDto,
  })
  async list(
    @Param() params: BookIdParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    const bookUci = await this.books.resolveBookUci(params.bookId);
    return this.pages.listByBook(bookUci, query);
  }

  @Get(':pageNo')
  @ApiOperation({
    summary: 'Get a page by its printed number',
    description:
      'The citation-shaped lookup: "volume 2, page 26". `pageNo` is the printed number, not a 1-based offset.',
  })
  @ZodResponse({
    status: 200,
    description: 'The page, with previous/next navigation',
    type: PageDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'No such book, or the book has no such printed page',
    type: ApiErrorDto,
  })
  @ApiBadRequestResponse({
    description:
      '`pageNo` is not a positive integer, or exceeds the frozen 9,999 per-book ceiling',
    type: ValidationErrorDto,
  })
  async findOne(@Param() params: BookPageNoParamDto) {
    const bookUci = await this.books.resolveBookUci(params.bookId);
    return this.pages.findByBookAndPageNo(bookUci, params.pageNo);
  }
}
