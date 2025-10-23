import { Module } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import configuration from 'src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/env/.env.${process.env.NODE_ENV}`,
      load: [configuration],
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
