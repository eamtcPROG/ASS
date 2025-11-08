import { ApiProperty } from '@nestjs/swagger';

export class PlaceOrderDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the product',
    type: 'number',
  })
  idproduct: number;
}
