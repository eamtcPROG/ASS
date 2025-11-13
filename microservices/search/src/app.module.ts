import { Module } from '@nestjs/common';
import configuration from './config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalErrorsInterceptor } from './interceptors/global-errors.interceptor';
import { GlobalResponseInterceptor } from './interceptors/global-response.interceptor';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './service/search.service';
import { ProductEventsController } from './events/product.events.controller';
import { ProductService } from './service/product.service';
import { Product } from './models/product.model';
import { OrderEventsController } from './events/order.events.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_RMQ } from './constants/service';
import { AuthRpcClient } from './auth/auth-rpc.client';
import { JwtIntrospectionGuard } from './auth/jwt-introspection.guard';

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
          entities: [Product],
        };
      },
    }),
    TypeOrmModule.forFeature([Product]),
    ClientsModule.registerAsync([
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
  ],
  controllers: [
    SearchController,
    ProductEventsController,
    OrderEventsController,
  ],
  providers: [
    SearchService,
    ProductService,
    AuthRpcClient,
    JwtIntrospectionGuard,
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
