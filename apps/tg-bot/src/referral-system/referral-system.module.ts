import { forwardRef, Module } from '@nestjs/common';
import { ReferralSystemService } from './referral-system.service';
import { ReferralSystemController } from './referral-system.controller';
import { ApiModule } from '../api/api.module';
import { BotFunctions } from '../bot/functions';

@Module({
  imports: [
    forwardRef(() => ApiModule)
  ],
  controllers: [ReferralSystemController],
  providers: [ReferralSystemService, BotFunctions],
  exports: [ReferralSystemService],
})
export class ReferralSystemModule {}
