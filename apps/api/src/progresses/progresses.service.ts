import { Injectable } from '@nestjs/common';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class ProgressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tgUserId: number) {
    const currentLevel = await this.prisma.level.findFirst()

    return this.prisma.userProgress.create({
      data: {
        tgUserId: tgUserId,
        currentLevelId: currentLevel.id,
      },
      include: {
        currentLevel: true,
        TgUser: true
      }
    });
  }

  findAll(tgUserId: number) {
    return this.prisma.userProgress.findMany({
      where: {
        tgUserId
      },
      include: {
        currentLevel: true,
        TgUser: true
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
        TgUser: true
      }
    });
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
