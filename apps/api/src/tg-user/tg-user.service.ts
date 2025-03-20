import { Injectable } from '@nestjs/common';
import { CreateTgUserDto } from './dto/create-tg-user.dto';
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class TgUserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createTgUserDto: CreateTgUserDto) {
    return this.prisma.tgUser.create({ data: createTgUserDto });
  }

  findAll(filters: Partial<CreateTgUserDto>) {
    return this.prisma.tgUser.findMany({
      where: {
        ...filters
      }
    });
  }

  findOne(id: number) {
    return this.prisma.tgUser.findUnique({ where: { id } });
  }

  remove(id: number) {
    return this.prisma.tgUser.delete({ where: { id } });
  }
}
