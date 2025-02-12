import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from '../bot/bot.module';
import { BotService } from '../bot/bot.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [BotModule, HttpModule],
  controllers: [AppController],
  providers: [AppService, BotService],
})
export class AppModule {}
