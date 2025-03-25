import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { TelegrafModule } from 'nestjs-telegraf';
import { ApiModule } from '../api/api.module';
import { BotFunctions } from './functions';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
    }),
    ApiModule,
  ],
  controllers: [BotController],
  providers: [BotService, BotFunctions],
})
export class BotModule {}
