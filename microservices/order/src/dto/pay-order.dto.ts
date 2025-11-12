import { ApiProperty } from '@nestjs/swagger';

export class PayOrderDto {
  @ApiProperty({
    example: 1,
    description: 'Amount to pay',
    type: 'number',
  })
  amount: number;
}
