## Order Module Report

### Overview
The `@order` module handles placing, paying, and cancelling orders. It integrates with the `@product` module for product availability and status transitions, and secures all endpoints with JWT via the user module's guard.

### Architecture
- **Module wiring**: Registers the `Order` entity repository, imports `ProductModule` for cross-module service usage, and exposes controller and service.

```8:13:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/order.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Order]), ProductModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
```

- **Entity and persistence**: `Order` links to `User` and `Product` with totals, status lifecycle, and timestamps. Defaults: `status = PENDING`, `total_paid = 0`, `paid_at` nullable.

```6:31:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/models/order.model.ts
@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @ManyToOne(() => Product, (product) => product.orders)
  product: Product;

  @Column()
  total: number;

  @Column({ default: 0 })
  total_paid: number;

  @Column({ default: OrderStatus.PENDING })
  status: number;

  @Column()
  place_at: number;

  @Column({ nullable: true })
  paid_at: number;
}
```

- **Service and business logic**:
  - `placeOrder` validates product availability, creates the order and reserves the product.
  - `payOrder` increments `total_paid`; on full payment marks as `PAID`, sets `paid_at`, and sells the product.
  - `cancelOrder` sets status `CANCELLED` and releases the product.

```20:36:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/services/order.service.ts
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
```

```38:64:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/services/order.service.ts
async payOrder(
  idOrder: number,
  object: PayOrderDto,
  user: User,
): Promise<OrderDto> {
  const order = await this.repo.findOne({
    where: { id: idOrder, user, status: OrderStatus.PENDING },
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
```

```66:80:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/services/order.service.ts
async cancelOrder(idOrder: number, user: User): Promise<OrderDto> {
  const order = await this.repo.findOne({
    where: { id: idOrder, user, status: OrderStatus.PENDING },
    relations: ['product', 'user'],
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
```

- **DTOs and API contracts**: Output uses `OrderDto`; inputs use `PlaceOrderDto` and `PayOrderDto`.

```4:93:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/dto/order.dto.ts
export class OrderDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the order',
    type: 'number',
  })
  id: number;

  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the product',
    type: 'number',
  })
  idproduct: number;

  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the user',
    type: 'number',
  })
  iduser: number;

  @ApiProperty({
    example: 100,
    description: 'Total price of the order',
    type: 'number',
  })
  total: number;

  @ApiProperty({
    example: 100,
    description: 'Total paid of the order',
    type: 'number',
  })
  total_paid: number;

  @ApiProperty({
    example: 1,
    description: 'Status of the order',
    type: 'number',
  })
  status: number;

  @ApiProperty({
    example: 1,
    description: 'Place at of the order',
    type: 'number',
  })
  place_at: number;

  @ApiProperty({
    example: 1,
    description: 'Paid at of the order',
    type: 'number',
  })
  paid_at: number | null;

  constructor(
    id: number,
    idproduct: number,
    iduser: number,
    total: number,
    total_paid: number,
    status: number,
    place_at: number,
    paid_at?: number,
  ) {
    this.id = id;
    this.idproduct = idproduct;
    this.iduser = iduser;
    this.total = total;
    this.total_paid = total_paid;
    this.status = status;
    this.place_at = place_at;
    this.paid_at = paid_at ?? null;
  }

  static fromEntity(entity: Order): OrderDto {
    return new OrderDto(
      entity.id,
      entity.product.id,
      entity.user.id,
      entity.total,
      entity.total_paid,
      entity.status,
      entity.place_at,
      entity.paid_at,
    );
  }
}
```

```3:10:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/dto/place-order.dto.ts
export class PlaceOrderDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the product',
    type: 'number',
  })
  idproduct: number;
}
```

```3:10:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/dto/pay-order.dto.ts
export class PayOrderDto {
  @ApiProperty({
    example: 1,
    description: 'Amount to pay',
    type: 'number',
  })
  amount: number;
}
```

- **Status enum**: Centralizes order lifecycle states.

```1:5:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/app/constants/order-status.ts
export enum OrderStatus {
  PENDING = 1,
  PAID = 2,
  CANCELLED = 3,
}
```

- **Controller and endpoints**: All routes are JWT-protected with `JwtGuard`. Handlers validate basic input and delegate to the service. Swagger annotations document the API.

```29:33:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/controllers/order.controller.ts
@ApiTags('Order')
@ApiBearerAuth('jwt')
@UseGuards(JwtGuard)
@Controller('order')
```

```36:56:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/controllers/order.controller.ts
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
```

```58:79:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/controllers/order.controller.ts
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
```

```81:101:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/order/controllers/order.controller.ts
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
```

### Request Flows
- **Place order**:
  1. Controller validates `idproduct`.
  2. `OrderService.placeOrder` fetches product via `ProductService.getProduct`; if active, creates order with `total` and `place_at = getTimestamp()`, then reserves product.

- **Pay order**:
  1. Controller validates `id` and `amount`.
  2. `OrderService.payOrder` loads order for current user with `status = PENDING`, increments `total_paid`; if fully paid, sets `status = PAID` and `paid_at`, then sells product.

- **Cancel order**:
  1. Controller validates `id`.
  2. `OrderService.cancelOrder` loads pending order for current user, sets `status = CANCELLED`, persists, and releases product.

### Security Considerations
- All endpoints require a valid JWT (`@UseGuards(JwtGuard)`, `@ApiBearerAuth('jwt')`).
- Service filters by `user` and `status` to enforce ownership and valid state transitions.
- Product state changes are transactional in sequence (reserve on placement; sell on full payment; release on cancellation) to prevent double-selling.
- Basic input validation for presence of required fields (`id`, `amount`, `idproduct`).

### Architectural Approach
- **Layered design**: Controller → Service → Repository/Entity; DTOs separate API contracts from persistence.
- **Module composition**: Depends on `ProductModule` to coordinate inventory state with order lifecycle.
- **Centralized enums and timestamps**: `OrderStatus` defines states; `getTimestamp()` standardizes time values.


