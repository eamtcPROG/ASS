import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../models/order.model';
import { ProductService } from 'src/product/services/product.service';
import { User } from 'src/user/models/user.model';
import { OrderDto } from '../dto/order.dto';
import { getTimestamp } from 'src/app/tools/common.tools';
import { PlaceOrderDto } from '../dto/place-order.dto';
import { PayOrderDto } from '../dto/pay-order.dto';
import { OrderStatus } from 'src/app/constants/order-status';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private repo: Repository<Order>,
    private readonly productService: ProductService,
  ) {}

  async placeOrder(object: PlaceOrderDto, user: User): Promise<OrderDto> {
    const product = await this.productService.getProduct(object.idproduct);
    if (!product) {
      throw new BadRequestException('Product not available');
    }
    const order = this.repo.create({
      product,
      user,
      total: product.price,
      place_at: getTimestamp(),
    });
    const result = await this.repo.save(order);
    if (result) {
      await this.productService.reserveProduct(result.product.id);
    }
    return OrderDto.fromEntity(result);
  }

  async payOrder(
    idOrder: number,
    object: PayOrderDto,
    user: User,
  ): Promise<OrderDto> {
    const order = await this.repo.findOne({
      where: { id: idOrder, user },
      relations: ['product', 'user'],
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
      await this.productService.sellProduct(result.product.id);
    }

    return OrderDto.fromEntity(result);
  }

  async cancelOrder(idOrder: number, user: User): Promise<OrderDto> {
    const order = await this.repo.findOne({
      where: { id: idOrder, user },
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    order.status = OrderStatus.CANCELLED;
    const result = await this.repo.save(order);
    if (result) {
      await this.productService.releaseProduct(result.product.id);
    }
    return OrderDto.fromEntity(result);
  }
}
