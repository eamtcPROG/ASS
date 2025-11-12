import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NewProductEventDto } from 'src/dto/new-product-event.dto';
import { ProductService } from 'src/services/product.service';

@Controller()
export class ProductEventsController {
  constructor(private readonly productService: ProductService) {}
  @EventPattern('new_product')
  async handleNewProduct(
    @Payload() data: NewProductEventDto,
    @Ctx() context: RmqContext,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const channel = context.getChannelRef();

    const originalMsg = context.getMessage();
    await this.productService.createProduct(data.id, data.name, data.price);
    // Minimal no-op handler; extend with domain logic as needed

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    channel.ack(originalMsg);
  }
}
