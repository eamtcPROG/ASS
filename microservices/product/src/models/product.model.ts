import { ProductStatus } from '../constants/product-status';

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  description: string;

  @Column({ default: ProductStatus.ACTIVE })
  status: number;

  @Column()
  iduser: number;
}
