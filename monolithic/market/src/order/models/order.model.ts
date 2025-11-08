import { OrderStatus } from 'src/app/constants/order-status';
import { Product } from 'src/product/models/product.model';
import { User } from 'src/user/models/user.model';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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
