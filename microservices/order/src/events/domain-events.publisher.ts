import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OrderStatus } from 'src/constants/order-status';

import { PRODUCT_RMQ, SEARCH_RMQ } from 'src/constants/service';
import { OrderEventDto } from 'src/dto/order-event.dto';

@Injectable()
export class DomainEventsPublisher {
  constructor(
    @Inject(PRODUCT_RMQ) private readonly productClient: ClientProxy,
    @Inject(SEARCH_RMQ) private readonly searchClient: ClientProxy,
  ) {}

  emitOrder(idProduct: number, status: OrderStatus) {
    const dto = new OrderEventDto(idProduct);
    switch (status) {
      case OrderStatus.CANCELLED: {
        this.productClient.emit('release_product', dto);
        this.searchClient.emit('release_product', dto);
        break;
      }
      case OrderStatus.PAID: {
        this.productClient.emit('sell_product', dto);
        this.searchClient.emit('sell_product', dto);
        break;
      }
      case OrderStatus.PENDING: {
        this.productClient.emit('reserve_product', dto);
        this.searchClient.emit('reserve_product', dto);
        break;
      }
      default:
        throw new BadRequestException('Invalid status');
    }
  }
}
