import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
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
import { JwtGuard } from 'src/guards/jwt.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { UserDto } from 'src/dto/user.dto';

@ApiTags('Product')
@ApiBearerAuth('jwt')
@UseGuards(JwtGuard)
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
  async addProduct(@Body() body: AddProductDto, @CurrentUser() user: UserDto) {
    if (!body.name || !body.price || !body.description) {
      throw new BadRequestException('Name, price and description are required');
    }
    if (!user.id) {
      throw new UnauthorizedException('User not found');
    }
    const result = await this.service.addProduct(body, user.id);
    // Emit domain event for other services
    this.events.emitNewProduct(result);

    return result;
  }
}
