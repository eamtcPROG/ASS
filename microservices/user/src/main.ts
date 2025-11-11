import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  if (!port) {
    throw new Error('PORT is not set');
  }
  const version = configService.get<string>('version');
  if (!version) {
    throw new Error('version is not set');
  }
  const config = new DocumentBuilder()
    .setTitle('API User Service')
    .setDescription(
      'HTTP API for the User service. Manage users, authentication, and other user-related operations with versioned endpoints, validation, and standard error responses.',
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
  await app.listen(port);
}
void bootstrap();
