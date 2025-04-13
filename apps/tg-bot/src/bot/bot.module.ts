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
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConfigsService } from '../configs/configs.service';
import { ConfigsModule } from '../configs/configs.module';
@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
    }),
    ApiModule,
    NotificationsModule,
    forwardRef(() => ReferralSystemModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ConfigsModule)
  ],
  exports: [BotService, BotFunctions],
  controllers: [BotController, ReferralSystemController],
  providers: [BotService, BotFunctions, ReferralSystemService, SubscriptionsService, ConfigsService],
})
export class BotModule {}
