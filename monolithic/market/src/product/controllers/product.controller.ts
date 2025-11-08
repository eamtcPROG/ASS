import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ResultListDto } from 'src/app/dto/resultlist.dto';
import { ProductDto } from '../dto/product.dto';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { User } from 'src/user/models/user.model';
import { AddProductDto } from '../dto/add-product.dto';
import { JwtGuard } from 'src/user/guards/jwt.guard';
import { ResultObjectDto } from 'src/app/dto/resultobject.dto';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @ApiOperation({ summary: 'Get a list of products' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ResultListDto<ProductDto>,
    description: 'List of products',
  })
  @ApiQuery({ name: 'page', type: Number, required: false })
  @ApiQuery({ name: 'onpage', type: Number, required: false })
  @Get('/')
  getList(@Query('page') page?: number, @Query('onpage') onpage?: number) {
    return this.service.getList(page ?? 1, onpage ?? 10);
  }

  @ApiOperation({ summary: 'Add a product' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ProductDto,
    description: 'Product',
  })
  @ApiBody({ type: AddProductDto })
  @UseGuards(JwtGuard)
  @ApiBearerAuth('jwt')
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
