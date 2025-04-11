import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { ApiModule } from '../api/api.module';
import { ReferralSystemModule } from '../referral-system/referral-system.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [BotModule, HttpModule, ApiModule, ReferralSystemModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
