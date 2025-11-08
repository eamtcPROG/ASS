import {
  BadRequestException,
  Body,
  Controller,
  Post,
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
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { User } from 'src/user/models/user.model';
import { AddProductDto } from '../dto/add-product.dto';
import { JwtGuard } from 'src/user/guards/jwt.guard';
import { ResultObjectDto } from 'src/app/dto/resultobject.dto';

@ApiTags('Product')
@UseGuards(JwtGuard)
@ApiBearerAuth('jwt')
@Controller('product')
export class ProductController {
  constructor(private readonly service: ProductService) {}

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
  addProduct(@Body() body: AddProductDto, @CurrentUser() user: User) {
    if (!body.name || !body.price || !body.description) {
      throw new BadRequestException('Name, price and description are required');
    }
    return this.service.addProduct(body, user);
  }
}
