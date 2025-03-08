import { PrismaService } from '@nash-vpn/db';
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CheckUserTrialAccessGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('CheckUserTrialAccessGuard triggered');

    const userIdField = this.reflector.get<string>('check-user-trial-access', context.getHandler());
    console.log({ userIdField })
    if (!userIdField) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.body?.[userIdField];

    console.log({ userId })

    if (!userId) {
      throw new ForbiddenException('User ID is missing in request body');
    }

    const userConfig = await this.prisma.config.findFirst({
      where: { userId, isTrial: true },
    });

    if (userConfig) {
      throw new ForbiddenException('Trial access denied');
    }

    return true;
  }
}
