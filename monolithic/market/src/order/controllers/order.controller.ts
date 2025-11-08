import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
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
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { JwtGuard } from 'src/user/guards/jwt.guard';
import { OrderDto } from '../dto/order.dto';
import { PlaceOrderDto } from '../dto/place-order.dto';
import { ResultObjectDto } from 'src/app/dto/resultobject.dto';
import { CurrentUser } from 'src/user/decorators/current-user.decorator';
import { User } from 'src/user/models/user.model';
import { PayOrderDto } from '../dto/pay-order.dto';

@ApiTags('Order')
@ApiBearerAuth('jwt')
@UseGuards(JwtGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @ApiOperation({ summary: 'Place an order' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: OrderDto,
    description: 'Order',
  })
  @ApiBody({ type: PlaceOrderDto })
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: 'Product not available',
  })
  @Post('/')
  async placeOrder(
    @Body() object: PlaceOrderDto,
    @CurrentUser() user: User,
  ): Promise<OrderDto> {
    if (!object.idproduct) {
      throw new BadRequestException('Invalid body');
    }
    return this.service.placeOrder(object, user);
  }

  @ApiOperation({ summary: 'Pay an order' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: OrderDto,
    description: 'Order',
  })
  @ApiBody({ type: PayOrderDto })
  @ApiParam({ name: 'id', description: 'Order id' })
  @Post('/pay/:id')
  async payOrder(
    @Body() object: PayOrderDto,
    @Param('id') id: number,
    @CurrentUser() user: User,
  ): Promise<OrderDto> {
    if (!id) {
      throw new BadRequestException('Invalid id');
    }
    if (!object.amount) {
      throw new BadRequestException('Invalid amount');
    }
    return this.service.payOrder(Number(id), object, user);
  }

  @ApiOperation({ summary: 'Cancel an order' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: OrderDto,
    description: 'Order',
  })
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: 'Order not found',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Order id' })
  @Get('/cancel/:id')
  async cancelOrder(
    @Param('id') id: number,
    @CurrentUser() user: User,
  ): Promise<OrderDto> {
    if (!id) {
      throw new BadRequestException('Invalid id');
    }
    return this.service.cancelOrder(id, user);
  }
}
