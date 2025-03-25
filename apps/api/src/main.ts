import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = process.env.API_PORT || 8080;
  const url = process.env.API_URL.replace("/api", "")
  const globalPrefix = 'api/v1';

  app.use(cookieParser());
  app.setGlobalPrefix(globalPrefix);
  await app.listen(port);
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    credentials: true,
    exposedHeaders: 'set-cookie',
  });

  Logger.log(
    `🚀 Application is running on: ${url}:${port}/${globalPrefix}`
  );
}

bootstrap();
