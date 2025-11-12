import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { ProductService } from '../services/product.service';
import { OrderEventDto } from 'src/dto/order-event.dto';

@Controller()
export class OrderEventsController {
  constructor(private readonly productService: ProductService) {}
  @EventPattern('release_product')
  async handleReleaseProduct(
    @Payload() data: OrderEventDto,
    @Ctx() context: RmqContext,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const channel = context.getChannelRef();

    const originalMsg = context.getMessage();
    await this.productService.releaseProduct(data.idproduct);
    // Minimal no-op handler; extend with domain logic as needed

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    channel.ack(originalMsg);
  }

  @EventPattern('sell_product')
  async handleSellProduct(
    @Payload() data: OrderEventDto,
    @Ctx() context: RmqContext,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const channel = context.getChannelRef();

    const originalMsg = context.getMessage();
    await this.productService.sellProduct(data.idproduct);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    channel.ack(originalMsg);
  }

  @EventPattern('reserve_product')
  async handleReserveProduct(
    @Payload() data: OrderEventDto,
    @Ctx() context: RmqContext,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const channel = context.getChannelRef();

    const originalMsg = context.getMessage();
    await this.productService.reserveProduct(data.idproduct);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    channel.ack(originalMsg);
  }
}
