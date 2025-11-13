import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../models/order.model';

import { OrderDto } from '../dto/order.dto';
import { getTimestamp } from '../tools/common.tools';
import { PlaceOrderDto } from '../dto/place-order.dto';
import { PayOrderDto } from '../dto/pay-order.dto';
import { OrderStatus } from '../constants/order-status';
import { ProductService } from './product.service';
import { DomainEventsPublisher } from 'src/events/domain-events.publisher';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private repo: Repository<Order>,
    private readonly productService: ProductService,
    private readonly domainEventsPublisher: DomainEventsPublisher,
  ) {}

  async placeOrder(object: PlaceOrderDto, idUser: number): Promise<OrderDto> {
    const product = await this.productService.getProduct(object.idproduct);
    if (!product) {
      throw new BadRequestException('Product not available');
    }
    const order = this.repo.create({
      idproduct: product.id,
      iduser: idUser,
      total: product.price,
      place_at: getTimestamp(),
    });
    const result = await this.repo.save(order);
    if (result) {
      await this.productService.reserveProduct(result.idproduct);
      this.domainEventsPublisher.emitOrder(
        result.idproduct,
        OrderStatus.PENDING,
      );
    }
    return OrderDto.fromEntity(result);
  }

  async payOrder(
    idOrder: number,
    object: PayOrderDto,
    idUser: number,
  ): Promise<OrderDto> {
    const order = await this.repo.findOne({
      where: { id: idOrder, iduser: idUser, status: OrderStatus.PENDING },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    order.total_paid = (order.total_paid ?? 0) + object.amount;
    const isFullyPaid = order.total_paid >= order.total;
    if (isFullyPaid) {
      order.status = OrderStatus.PAID;
      order.paid_at = getTimestamp();
    }
    const result = await this.repo.save(order);

    if (isFullyPaid) {
      await this.productService.sellProduct(result.idproduct);
      this.domainEventsPublisher.emitOrder(result.idproduct, OrderStatus.PAID);
    }

    return OrderDto.fromEntity(result);
  }

  async cancelOrder(idOrder: number, idUser: number): Promise<OrderDto> {
    const order = await this.repo.findOne({
      where: { id: idOrder, iduser: idUser, status: OrderStatus.PENDING },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    order.status = OrderStatus.CANCELLED;
    const result = await this.repo.save(order);

    if (result) {
      await this.productService.releaseProduct(result.idproduct);
      this.domainEventsPublisher.emitOrder(
        result.idproduct,
        OrderStatus.CANCELLED,
      );
    }
    return OrderDto.fromEntity(result);
  }
}
