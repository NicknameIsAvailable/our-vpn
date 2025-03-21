import { PrismaService } from '@nash-vpn/db';
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CheckUserTrialAccessGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('CheckUserTrialAccessGuard triggered');

    const request = context.switchToHttp().getRequest();
    const tgUserId = Number(request.headers['tguserid']);
    const { isTrial } = request.body;

    if (!isTrial) return true;

    if (!tgUserId) {
      throw new BadRequestException('tgUserId не найден в заголовках');
    }

    const userConfig = await this.prisma.config.findFirst({
      where: {
        tgUserId: tgUserId,
        isTrial: true
      }
    });

    if (userConfig) {
      throw new ForbiddenException('Trial access denied');
    }

    return true;
  }
}
