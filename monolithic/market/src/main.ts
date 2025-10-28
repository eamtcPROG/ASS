import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './app/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');
  if (!port) {
    throw new Error('PORT is not set');
  }
  const version = configService.get<string>('version');
  if (!version) {
    throw new Error('version is not set');
  }
  const config = new DocumentBuilder()
    .setTitle('API Market')
    .setDescription(
      'HTTP API for the Market service. Manage products, users, and search with versioned endpoints, validation, and standard error responses.',
    )
    .addBearerAuth(
      {
        description: `[just text field] Please enter token in following format: Bearer `,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
      },
      'jwt',
    )
    .setVersion(version)
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(port);
}
void bootstrap();
