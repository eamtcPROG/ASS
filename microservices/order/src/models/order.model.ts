import { OrderStatus } from '../constants/order-status';

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  iduser: number;

  @Column()
  idproduct: number;

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
