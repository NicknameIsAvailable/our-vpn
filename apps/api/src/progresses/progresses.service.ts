import { Injectable } from '@nestjs/common';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class ProgressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tgUserId: bigint) {
    const currentLevel = await this.prisma.level.findFirst();

    const userProgress = await this.prisma.userProgress.create({
      data: {
        tgUserId,
        currentLevelId: currentLevel.id,
      },
      include: {
        currentLevel: true,
      }
    });

    await this.prisma.tgUser.update({
      where: { id: tgUserId },
      data: { userProgressId: userProgress.id }
    });

    return userProgress;
  }

  findAll(tgUserId: bigint) {
    return this.prisma.userProgress.findMany({
      where: {
        tgUserId
      },
      include: {
        currentLevel: true,
        tgUser: true
      }
    });
  }

  findOne(id: string) {
    return this.prisma.userProgress.findUnique({
      where: {
        id
      },
      include: {
        currentLevel: true,
        tgUser: true
      }
    });
  }

  findMe(tgUserId: bigint) {
    return this.prisma.userProgress.findUnique({
      where: {
        tgUserId
      },
      include: {
        currentLevel: true,
        tgUser: true
      }
    });
  }

  async getReferralRating() {
    const usersWithReferrals = await this.prisma.tgUser.findMany({
      select: {
        id: true,
        username: true,
        userProgress: {
          select: {
            id: true,
            currentLevel: true,
            currentLevelId: true,
            updated_at: true,
            created_at: true
          }
        },
        userProgressId: true,
        ownedPromoCode: {
          select: {
            users: {
              select: {
                id: true,
                username: true,
                userProgress: true,
                userProgressId: true,
              },
            },
          },
        },
      },
    });

    return usersWithReferrals
      .map(user => ({
        id: user.id,
        username: user.username,
        referralCount: user.ownedPromoCode?.users?.length,
        userProgress: user.userProgress,
        userProgressId: user.userProgressId
      }))
      .sort((a, b) => b.referralCount - a.referralCount);
  }

  async upgrade(tgUserId: bigint) {
    const userProgress = await this.prisma.userProgress.findUnique({
      where: { tgUserId },
      include: {
        currentLevel: true
      }
    });

    if (!userProgress) {
      throw new Error('User progress not found');
    }

    const { currentLevel } = userProgress;

    const nextLevel = await this.prisma.level.findFirst({
      where: {
        usersCount: { gt: currentLevel.usersCount }
      }
    });

    if (!nextLevel) {
      throw new Error('No next level found');
    }

    if (nextLevel.usersCount <= currentLevel.usersCount) {
      const updatedProgress = await this.prisma.userProgress.update({
        where: { id: userProgress.id },
        data: {
          currentLevelId: nextLevel.id
        },
        include: {
          currentLevel: true
        }
      });

      const userPromoCode = await this.prisma.promoCode.findUnique({
        where: {
          ownerId: tgUserId
        }
      });

      if (userPromoCode) {
        await this.prisma.promoCode.update({
          where: { id: userPromoCode.id },
          data: {
            name: `Промокод уровня "${nextLevel.label}" ${userPromoCode.name.split(' ').slice(-1)[0]}`,
            description: `Промокод уровня "${nextLevel.label}" пользователя ${userPromoCode.name.split(' ').slice(-1)[0]}\\. ${nextLevel.comment}`,
            discountPercent: nextLevel.constantBonusDiscount,
            bonusDays: nextLevel.constantBonusDays,
            usesCount: nextLevel.usersCount,
            referralDiscountPercent: nextLevel.referralDiscountPercent
          }
        });
      }

      return updatedProgress;
    }

    return userProgress;
  }

  update(id: string, updateProgressDto: UpdateProgressDto) {
    return this.prisma.userProgress.update({
      data: updateProgressDto,
      where: {
        id
      }
    });
  }

  remove(id: string) {
    return this.prisma.userProgress.delete({
      where: {
        id
      }
    });
  }
}
