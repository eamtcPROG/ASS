import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';

import { ProductDto } from '../dto/product.dto';
import { AddProductDto } from '../dto/add-product.dto';

import { ResultObjectDto } from '../dto/resultobject.dto';
import { DomainEventsPublisher } from '../events/domain-events.publisher';

@ApiTags('Product')
@ApiBearerAuth('jwt')
@Controller()
export class ProductController {
  constructor(
    private readonly service: ProductService,
    private readonly events: DomainEventsPublisher,
  ) {}

  @ApiOperation({ summary: 'Add a product' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ProductDto,
    description: 'Product',
  })
  @ApiBody({ type: AddProductDto })
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: 'Name, price and description are required',
  })
  @Post('/')
  async addProduct(
    @Body() body: AddProductDto,
    // , @CurrentUser() user: User
  ) {
    if (!body.name || !body.price || !body.description) {
      throw new BadRequestException('Name, price and description are required');
    }
    const result = await this.service.addProduct(body);
    // Emit domain event for other services
    this.events.emitNewProduct(result);

    return result;
  }
}
