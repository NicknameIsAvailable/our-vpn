import { Injectable } from '@nestjs/common';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class LevelsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createLevelDto: CreateLevelDto) {
    return this.prisma.level.create({
      data: createLevelDto
    });
  }

  findAll() {
    return this.prisma.level.findMany();
  }

  findOne(id: string) {
    return this.prisma.level.findUnique({
      where: {
        id
      }
    });
  }

  update(id: string, updateLevelDto: UpdateLevelDto) {
    return this.prisma.level.update({
      where: {
        id
      },
      data: updateLevelDto
    });
  }

  remove(id: string) {
    return this.prisma.level.findUnique({
      where: {
        id
      }
    });
  }
}
