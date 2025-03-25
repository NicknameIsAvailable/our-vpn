import { Module } from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import { PromoCodeController } from './promo-code.controller';

@Module({
  controllers: [PromoCodeController],
  providers: [PromoCodeService],
})
export class PromoCodeModule {}
