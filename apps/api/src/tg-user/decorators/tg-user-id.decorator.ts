import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { TgUserService } from '../tg-user.service';
import { PrismaService } from '@nash-vpn/db';

export const TgUserData = createParamDecorator(
  async (_, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const tgUserId = request.headers['tguserid'];

    if (!tgUserId) {
      throw new BadRequestException('Пользователь не авторизован');
    }

    const prismaService = new PrismaService()
    const tgUserService = new TgUserService(prismaService)

    if (!tgUserService) {
      throw new BadRequestException('Сервис не доступен');
    }

    const user = await tgUserService.findOne(BigInt(tgUserId));

    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    return user;
  },
);
