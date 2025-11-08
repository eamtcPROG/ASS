import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './models/order.model';
import { OrderService } from './services/order.service';
import { OrderController } from './controllers/order.controller';
import { ProductModule } from 'src/product/produc.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), ProductModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
