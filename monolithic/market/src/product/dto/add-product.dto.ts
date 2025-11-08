import { ApiProperty } from '@nestjs/swagger';

export class AddProductDto {
  @ApiProperty({
    example: 'Product name',
    description: 'Product name',
    type: 'string',
  })
  name: string;
  @ApiProperty({
    example: 100,
    description: 'Product price',
    type: 'number',
  })
  price: number;
  @ApiProperty({
    example: 'Product description',
    description: 'Product description',
    type: 'string',
  })
  description: string;
}
