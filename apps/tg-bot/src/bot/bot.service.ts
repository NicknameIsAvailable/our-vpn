import { Injectable } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { InjectBot } from 'nestjs-telegraf';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { clients, instructions, osList } from '../assets/assets';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly httpService: HttpService,
  ) {
    const botName = process.env.BOT_NAME;

    this.bot.start((ctx) => ctx.reply('Привет!'));

    this.bot.command("help", async (ctx) => {
      try {
        const msg = await ctx.reply("Как пользоваться ВПН");

        await ctx.reply("Выберите свою операционную систему", {
          reply_markup: {
            inline_keyboard: [
              ...osList.map(os => ([{
                text: os.name,
                callback_data: os.key,
              }])),
            ],
          },
        });

        // Обработка выбора ОС
        this.bot.on("callback_query", async (ctx) => {
          const osKey = (ctx.callbackQuery as any).data;

          if (osKey === "back_to_start") {
            await ctx.editMessageText("Как пользоваться ВПН");
            await ctx.editMessageReplyMarkup({
              inline_keyboard: [
                ...osList.map(os => ([{
                  text: os.name,
                  callback_data: os.key,
                }])),
                [{ text: "Назад", callback_data: "back_to_start" }]
              ],
            });
            await ctx.answerCbQuery();
            return;
          }

          const currentOs = osList.find(os => os.key === osKey);
          if (currentOs) {
            const currentClients = clients.filter(client => client.os === osKey);
            const formattedClients = currentClients.map(client => ([{
              text: client.name,
              callback_data: client.key,
            }]));

            await ctx.editMessageText(
              `Выберите свой VPN клиент для *${currentOs.name}*. *${botName}* работает на протоколе VLess, поэтому можно использовать только клиенты из списка ниже:`,
              {
                parse_mode: "Markdown",
                reply_markup: {
                  inline_keyboard: [
                    ...formattedClients,
                    [{ text: "Назад", callback_data: "back_to_start" }]
                  ],
                },
              }
            );
            await ctx.answerCbQuery();
          } else {
            await ctx.answerCbQuery();
            await ctx.reply("Ошибка выбора ОС");
          }
        });

        // Обработка выбора клиента
        this.bot.on("callback_query", async (ctx) => {
          const clientKey = (ctx.callbackQuery as any).data;
          const instruction = instructions.find(instr => instr.key === clientKey);

          if (instruction) {
            await ctx.editMessageText(
              `📌 **Инструкция для ${instruction.key}**\n\n${instruction.text}\n\n🔗 [Скачать](${instruction.downloadLink})`,
              { parse_mode: "Markdown" }
            );
            await ctx.answerCbQuery();
          } else {
            await ctx.answerCbQuery();
            await ctx.reply("Инструкция не найдена 😢");
          }
        });

      } catch (error) {
        console.error(error);
        await ctx.reply("Ошибка");
      }
    });

    // Команда генерации конфигурации
    this.bot.command("generateConfig", async (ctx) => {
      ctx.reply("Генерация конфига");
    });

    // Команда авторизации
    this.bot.command('auth', async (ctx) => {
      // Запрашиваем email и пароль пользователя
      await ctx.reply('Введите ваш email:');

      this.bot.on('text', async (messageCtx) => {
        const email = messageCtx.message.text;

        // Запрашиваем пароль после ввода email
        await messageCtx.reply('Введите ваш пароль:');

        this.bot.on('text', async (passwordCtx) => {
          const password = passwordCtx.message.text;

          try {
            // Отправляем запрос на авторизацию
            const authResponse = await this.authenticateUser(email, password);

            if (authResponse) {
              // Если авторизация успешна, отправляем сообщение с токеном или другим результатом
              await passwordCtx.reply(`Вы успешно авторизовались! Токен: ${authResponse.token}`);
            } else {
              await passwordCtx.reply('Не удалось авторизоваться. Проверьте email и пароль.');
            }
          } catch (error) {
            console.error(error);
            await passwordCtx.reply('Произошла ошибка при авторизации.');
          }
        });
      });
    });
  }

  async authenticateUser(email: string, password: string) {
    const url = `${process.env.API_URL}/v1/auth/login`;
    const body = {
      email: email,
      password: password,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body ),
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка авторизации', error);
      return null;
    }
  }
}
