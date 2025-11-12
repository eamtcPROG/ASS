import { ProductStatus } from '../constants/product-status';

import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  description: string;

  @Column({ default: ProductStatus.ACTIVE })
  status: number;
}
