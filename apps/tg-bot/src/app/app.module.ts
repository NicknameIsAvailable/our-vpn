import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BotModule } from '../bot/bot.module';
import { BotService } from '../bot/bot.service';
import { HttpModule } from '@nestjs/axios';
import { ApiService } from '../api/api.service';
import { ApiModule } from '../api/api.module';

@Module({
  imports: [BotModule, HttpModule, ApiModule],
  controllers: [AppController],
  providers: [AppService, BotService, ApiService],
})
export class AppModule {}
