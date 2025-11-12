import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ProductDto } from '../dto/product.dto';
import { ORDER_RMQ, SEARCH_RMQ } from 'src/constants/service';

@Injectable()
export class DomainEventsPublisher {
  constructor(
    @Inject(ORDER_RMQ) private readonly orderClient: ClientProxy,
    @Inject(SEARCH_RMQ) private readonly searchClient: ClientProxy,
  ) {}

  emitNewProduct(product: ProductDto) {
    this.orderClient.emit('new_product', product);
    this.searchClient.emit('new_product', product);
  }
}
