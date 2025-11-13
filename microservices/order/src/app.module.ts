import { Module } from '@nestjs/common';
import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalErrorsInterceptor } from './interceptors/global-errors.interceptor';
import { GlobalResponseInterceptor } from './interceptors/global-response.interceptor';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { Order } from './models/order.model';
import { ProductEventsController } from './events/product.events.controller';
import { Product } from './models/product.model';
import { ProductService } from './services/product.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCT_RMQ, SEARCH_RMQ, USER_RMQ } from './constants/service';
import { DomainEventsPublisher } from './events/domain-events.publisher';
import { AuthClient } from './clients/auth.client';
import { JwtGuard } from './guards/jwt.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/env/.env.${process.env.NODE_ENV}`,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'postgres',
          host: config.get<string>('database.host'),
          port: config.get<number>('database.port'),
          username: config.get<string>('database.username'),
          password: config.get<string>('database.password'),
          database: config.get<string>('database.database'),
          synchronize: true,
          entities: [Order, Product],
        };
      },
    }),
    ClientsModule.registerAsync([
      {
        name: SEARCH_RMQ,
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('rabbitmq.url')],
            queue: 'search',
          },
        }),
        inject: [ConfigService],
      },
      {
        name: PRODUCT_RMQ,
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('rabbitmq.url')],
            queue: 'product',
          },
        }),
        inject: [ConfigService],
      },
      {
        name: USER_RMQ,
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('rabbitmq.url')],
            queue: 'user',
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    TypeOrmModule.forFeature([Order, Product]),
  ],
  controllers: [OrderController, ProductEventsController],
  providers: [
    OrderService,
    ProductService,
    DomainEventsPublisher,
    AuthClient,
    JwtGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalErrorsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: GlobalResponseInterceptor,
    },
  ],
})
export class AppModule {}
