import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from '../bot/bot.module';
import { BotService } from '../bot/bot.service';
import { HttpModule } from '@nestjs/axios';
import { ApiService } from '../api/api.service';
import { ApiModule } from '../api/api.module';
import { BotFunctions } from '../bot/functions';
import { LoggerMiddleware } from '../logger/logger.middleware';

@Module({
  imports: [BotModule, HttpModule, ApiModule],
  controllers: [AppController],
  providers: [AppService, BotService, ApiService, BotFunctions],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*")
  }
}
