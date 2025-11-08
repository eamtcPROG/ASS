import { Status } from 'src/app/constants/status';
import { User } from 'src/user/models/user.model';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ default: Status.ACTIVE })
  status: number;

  @ManyToOne(() => User, (user) => user.products)
  user: User;
}
