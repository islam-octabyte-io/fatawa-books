import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { ApiErrorDto, ValidationErrorDto } from '../common/api-error.dto';
import { PaginationQueryDto } from '../common/pagination';
import {
  BookDetailDto,
  BookIdParamDto,
  PaginatedBooksDto,
} from './books.dto';
import { BooksService } from './books.service';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly books: BooksService) {}

  @Get()
  @ApiOperation({
    summary: 'List the catalogue',
    description: 'Books in catalogue order, which is also the browse order.',
  })
  @ZodResponse({
    status: 200,
    description: 'A page of the catalogue',
    type: PaginatedBooksDto,
  })
  @ApiBadRequestResponse({
    description: '`limit` or `offset` is out of range or not a number',
    type: ValidationErrorDto,
  })
  list(@Query() query: PaginationQueryDto) {
    return this.books.list(query);
  }

  @Get(':bookId')
  @ApiOperation({
    summary: 'Get one book',
    description: 'Resolves the book by UCI or slug and adds its row counts.',
  })
  @ZodResponse({
    status: 200,
    description: 'The book, with page and TOC entry counts',
    type: BookDetailDto,
  })
  @ApiNotFoundResponse({
    description: 'No book has that UCI or slug',
    type: ApiErrorDto,
  })
  findOne(@Param() params: BookIdParamDto) {
    return this.books.findOne(params.bookId);
  }
}
