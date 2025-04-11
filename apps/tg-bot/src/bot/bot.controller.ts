import { Controller } from '@nestjs/common';
import { BotService } from './bot.service';
import { ReferralSystemService } from '../referral-system/referral-system.service';
import { On } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Message, Update } from 'telegraf/typings/core/types/typegram';
import { BotFunctions } from './functions';

@Controller('bot')
export class BotController {
  constructor(
    private readonly botService: BotService,
    private readonly botFunctions: BotFunctions,
    private readonly referralSystemService: ReferralSystemService
  ) {}

  @On("text")
  async onMessage(ctx: Context<{
    message: Update.New & Update.NonChannel & Message.TextMessage;
    update_id: number;
  }>) {
    this.botFunctions.handleMenuButtonClick(ctx)
  }
}
