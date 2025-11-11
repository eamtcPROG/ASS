import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../models/product.model';

export class ProductDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the product',
    type: 'number',
  })
  id: number;

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

  constructor(id: number, name: string, price: number, description: string) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.description = description;
  }

  static fromEntity(entity: Product): ProductDto {
    return new ProductDto(
      entity.id,
      entity.name,
      entity.price,
      entity.description,
    );
  }
}
