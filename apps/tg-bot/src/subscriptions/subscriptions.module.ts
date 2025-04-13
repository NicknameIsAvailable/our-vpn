import { forwardRef, Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { ApiModule } from '../api/api.module';
import { ConfigsModule } from '../configs/configs.module';
import { ConfigsService } from '../configs/configs.service';
@Module({
  imports: [
    forwardRef(() => ApiModule),
    forwardRef(() => ConfigsModule)
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, ConfigsService],
  exports: [SubscriptionsService]
})
export class SubscriptionsModule {}
