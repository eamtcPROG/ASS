import { ApiProperty } from '@nestjs/swagger';
import { Order } from '../models/order.model';

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
      entity.idproduct,
      entity.iduser,
      entity.total,
      entity.total_paid,
      entity.status,
      entity.place_at,
      entity.paid_at,
    );
  }
}
