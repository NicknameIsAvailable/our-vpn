import { Module } from '@nestjs/common';
import { TgUserService } from './tg-user.service';
import { TgUserController } from './tg-user.controller';

@Module({
  controllers: [TgUserController],
  providers: [TgUserService],
})
export class TgUserModule {}
