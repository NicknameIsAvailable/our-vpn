import { Injectable } from '@nestjs/common';
import { PaymentInfo, SendConfigDto } from './dto/create-hook.dto';
import { ApiService } from '../api/api.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { MyContext } from '../bot/bot.service';
import { BotFunctions } from '../bot/functions';

@Injectable()
export class HookService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<MyContext>,
    private readonly apiService: ApiService,
    private botFunctions: BotFunctions
  ) {}

  async sendConfig(sendConfigDto: SendConfigDto, paymentInfo: PaymentInfo) {
    try {
      const invoice = await this.apiService.findInvoice(paymentInfo.object.id)
      console.log({invoice})
      if (invoice.configId && invoice.paid) return;


      const config = await this.apiService.createConfig({ ...sendConfigDto, isTrial: String(sendConfigDto.isTrial) === "true" });
      const newInvoice = await this.apiService.updateInvoice(paymentInfo.object.id, {
        configId: config.id,
        ...invoice
      })
      const caption = this.botFunctions.showUserConfig(config);
      const message = await this.bot.telegram.sendMessage(sendConfigDto.userId, caption, {
        parse_mode: "MarkdownV2",
      });

      return {
        success: true,
        config,
        caption,
        newInvoice,
        message
      };
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      return {
        message: "Ошибка при отправке сообщения",
        error
      };
    }
  }
}
