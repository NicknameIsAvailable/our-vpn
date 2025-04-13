import { forwardRef, Module } from '@nestjs/common';
import { ReferralSystemService } from './referral-system.service';
import { ReferralSystemController } from './referral-system.controller';
import { ApiModule } from '../api/api.module';
import { BotFunctions } from '../bot/functions';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ConfigsService } from '../configs/configs.service';
import { ConfigsModule } from '../configs/configs.module';
@Module({
  imports: [
    forwardRef(() => ApiModule),
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => ConfigsModule)
  ],
  controllers: [ReferralSystemController],
  providers: [ReferralSystemService, BotFunctions, SubscriptionsService, ConfigsService],
  exports: [ReferralSystemService],
})
export class ReferralSystemModule {}
