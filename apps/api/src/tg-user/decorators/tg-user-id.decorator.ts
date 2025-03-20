import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const TgUserId = createParamDecorator((_, ctx: ExecutionContext): number => {
  const request = ctx.switchToHttp().getRequest();
  const tgUserId = request.headers['tguserid'];

  if (!tgUserId) {
    throw new BadRequestException('Пользователь не авторизован');
  }

  return Number(tgUserId);
});
