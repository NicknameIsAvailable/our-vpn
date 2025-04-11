import { forwardRef, Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { TelegrafModule } from 'nestjs-telegraf';
import { ApiModule } from '../api/api.module';
import { BotFunctions } from './functions';
import { ReferralSystemModule } from '../referral-system/referral-system.module';
import { ReferralSystemService } from '../referral-system/referral-system.service';
import { ReferralSystemController } from '../referral-system/referral-system.controller';
import { NotificationsModule } from '../notifications/notifications.module';
@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
    }),
    ApiModule,
    NotificationsModule,
    forwardRef(() => ReferralSystemModule)
  ],
  exports: [BotService, BotFunctions],
  controllers: [BotController, ReferralSystemController],
  providers: [BotService, BotFunctions, ReferralSystemService],
})
export class BotModule {}
