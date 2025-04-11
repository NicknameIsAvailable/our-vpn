import { TgUserFullData } from 'types/tg-user-full-data';
import { Injectable } from '@nestjs/common';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PrismaService } from '@nash-vpn/db';
import { PromoCode, PromoCodeType, TgUser } from '@prisma/client';
import {generateRandomString} from 'functions/generate-random-string'
import { NotifyReferralDtoInterface } from 'types/notify-referral';
import { ApiService } from '../api/api.service';

@Injectable()
export class PromoCodeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiService: ApiService
  ) {}

  async create(createPromoCodeDto: CreatePromoCodeDto, user: TgUserFullData) {
    const code = createPromoCodeDto.code || generateRandomString(10);
    const url = `https://t.me/${process.env.BOT_USERNAME}?start=usepromo_${code}`;

    const data = {
      code,
      url,
      ownerId: BigInt(user.id),
      type: PromoCodeType.REFERRAL,
      ...createPromoCodeDto,
    };

    const response = await this.prisma.promoCode.create({ data, include: {
      users: true,
      referrerProgress: true,
      configs: true,
    }})

    return {
      ...response,
      referrerId: String(response.ownerId)
    };
  }

  async createUserPromoCode(tgUser: TgUserFullData) {
    // Проверяем, есть ли уже промокод у пользователя
    const existingPromoCode = await this.prisma.promoCode.findUnique({
      where: {
        ownerId: BigInt(tgUser.id)
      }
    });

    if (existingPromoCode) {
      return {
        ...existingPromoCode,
        referrerId: String(existingPromoCode.ownerId)
      };
    }

    const currentLevel = await this.prisma.level.findUnique({
      where: {
        id: tgUser.userProgress.currentLevelId
      }
    })

    return await this.create({
      name: `Промокод уровня "${currentLevel.label}" ${tgUser.username === "anon" ? tgUser.id : tgUser.username}`,
      description: `Промокод уровня "${currentLevel.label}" пользователя ${tgUser.username === "anon" ? tgUser.id : tgUser.username}\\. ${currentLevel.comment}`,
      discountPercent: currentLevel.constantBonusDiscount,
      bonusDays: currentLevel.constantBonusDays,
      usesCount: currentLevel.usersCount
    }, tgUser)
  }

  findAll() {
    return this.prisma.promoCode.findMany()
  }

  async savePromoCode(tgUserId: bigint, promoCodeId: string) {
    return this.prisma.tgUser.update({
      where: { id: tgUserId },
      data: {
        savedPromoCodes: {
          connect: { id: promoCodeId },
        },
      },
      include: { savedPromoCodes: true },
    });
  }

  async removeSavedPromoCode(tgUserId: bigint, promoCodeId: string) {
    return this.prisma.tgUser.update({
        where: { id: tgUserId },
        data: {
            savedPromoCodes: {
                disconnect: { id: promoCodeId },
            },
        },
        include: { savedPromoCodes: true },
    });
  }

  async usePromoCode(tgUserId: bigint, promoCodeId: string) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id: promoCodeId },
      include: { users: true, owner: { include: { userProgress: true } } },
    });

    if (!promoCode) throw new Error("Промокод не найден");

    const alreadyUsed = promoCode.users.some(user => user.id === tgUserId);
    if (alreadyUsed) throw new Error("Вы уже использовали этот промокод");

    const data = await this.prisma.tgUser.update({
      where: { id: tgUserId },
      data: {
        usedPromoCodes: {
          connect: { id: promoCodeId },
        },
        savedPromoCodes: {
          disconnect: { id: promoCodeId },
        },
      },
      include: { usedPromoCodes: true, savedPromoCodes: true },
    });

    console.log("promoCode", promoCode)

    if (promoCode.owner?.userProgress) {
      await this.prisma.userProgress.update({
        where: { id: promoCode.owner.userProgress.id },
        data: {
          accumulatedDays: {
            increment: promoCode.bonusDays
          }
        }
      });
    }

    const notifyReferralDto: NotifyReferralDtoInterface = {
      referrerId: String(tgUserId),
      referral: data,
      promoCode: promoCode,
    }

    try {
      await this.apiService.notifyReferral(notifyReferralDto);
      console.log("Referral notification sent successfully");
    } catch (error) {
      console.error("Failed to send referral notification:", error);
    }

    return data;
  }

  async removeUsedPromoCode(tgUserId: bigint, promoCodeId: string) {
    return this.prisma.tgUser.update({
        where: { id: tgUserId },
        data: {
            usedPromoCodes: {
                disconnect: { id: promoCodeId },
            },
        },
        include: { usedPromoCodes: true },
    });
  }

  findByCode(params: { code: string }) {
    return this.prisma.promoCode.findUnique({
      where: params,
      include: {
        users: true,
        savedByUsers: true,
        referrerProgress: true,
        owner: true
      }
    })
  }

  findMy(tgUserId: bigint) {
    return this.prisma.promoCode.findUnique({
      where: {
        ownerId: tgUserId
      },
      include: {
        users: true,
        referrerProgress: true,
      }
    })
  }

  async getSavedPromoCodes(tgUserId: bigint) {
    const user = await this.prisma.tgUser.findUnique({
      where: { id: tgUserId },
      include: {
        savedPromoCodes: {
          include: {
            users: true,
            referrerProgress: true,
            owner: true
          }
        }
      }
    });

    if (!user) throw new Error("Пользователь не найден");

    return user.savedPromoCodes;
  }

  findOne(params: { id?: string, code?: string, name?: string }) {
    return this.prisma.promoCode.findFirst({
      where: {
        AND: [
          params.id ? { id: params.id } : {},
          params.code ? { code: params.code } : {},
          params.name ? { name: params.name } : {}
        ]
      }
    });
  }

  update(id: string, updatePromoCodeDto: UpdatePromoCodeDto) {
    return this.prisma.promoCode.update({ data: updatePromoCodeDto, where: {id} });
  }

  remove(id: string) {
    return this.prisma.promoCode.delete({ where: { id } });
  }
}
