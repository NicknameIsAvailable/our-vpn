import { Module } from '@nestjs/common';
import { HookService } from './hook.service';
import { HookController } from './hook.controller';
import { ApiService } from '../api/api.service';
import { BotFunctions } from '../bot/functions';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [HookController],
  providers: [HookService, ApiService, BotFunctions],
})
export class HookModule {}
