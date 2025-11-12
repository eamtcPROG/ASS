import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SearchService } from '../service/search.service';
import { ResultListDto } from '../dto/resultlist.dto';

@ApiTags('Search')
@Controller()
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @ApiOperation({ summary: 'Get a list of products' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ResultListDto<any>,
    description: 'List of products',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'onpage', type: Number, required: false })
  @Get('/')
  getList(
    @Query('page') page?: number,
    @Query('onpage') onpage?: number,
    @Query('q') query?: string,
  ) {
    return this.service.search(page ?? 1, onpage ?? 10, query ?? '');
  }
}
