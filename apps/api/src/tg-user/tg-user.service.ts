import { Injectable } from '@nestjs/common';
import { CreateTgUserDto } from './dto/create-tg-user.dto';
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class TgUserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTgUserDto: CreateTgUserDto) {
    const data = await this.prisma.tgUser.create({ data: createTgUserDto })
    return {
      ...data,
      id: data.id.toString()
    };
  }

  async findAll(filters: Partial<CreateTgUserDto>) {
    const data = await this.prisma.tgUser.findMany({
      where: {
        ...filters
      }
    })
    return data.map(item => ({
      ...item,
      id: item.id.toString()
    }));
  }

  async findOne(id: number) {
    const data = await this.prisma.tgUser.findUnique({ where: { id } })
    return {
      ...data,
      id: data.id.toString()
    };
  }

  remove(id: number) {
    return this.prisma.tgUser.delete({ where: { id } });
  }
}
