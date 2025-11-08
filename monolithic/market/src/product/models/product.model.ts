import { ProductStatus } from 'src/app/constants/product-status';
import { Order } from 'src/order/models/order.model';
import { User } from 'src/user/models/user.model';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

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

  @ManyToOne(() => User, (user) => user.products)
  user: User;

  @OneToMany(() => Order, (order) => order.product)
  orders: Order[];
}
