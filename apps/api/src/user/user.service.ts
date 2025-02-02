import { Injectable } from '@nestjs/common';
import { hash } from 'argon2';
import { RegistrationDto } from '../auth/dto/registration.dto';
import { UserDto } from './dto/user.dto';
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  }

  getByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(dto: RegistrationDto) {
    const user = {
      email: dto.email,
      nickname: dto.nickname,
      password: await hash(dto.password),
    };

    return this.prisma.user.create({
      data: user,
    });
  }

  async getProfile(id: string) {
    const profile = await this.getById(id);
    return profile;
  }

  async update(id: string, dto: UserDto) {
    let data = dto;

    if (dto.password) {
      data = { ...data, password: await hash(data.password) };
    }

    return this.prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }
}
