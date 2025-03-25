import { InboundResponse, xuiApi } from '@nash-vpn/xui';
import { Injectable } from '@nestjs/common';
import { CreateConfigDto } from './dto/create-config.dto';
import { PrismaService } from '@nash-vpn/db';
import { VlessConfig } from "types/vless"
import { Location, PromoCode } from "@prisma/client";

@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInbound(
    location: Location,
    expiryTime: number,
    email: string,
    username: string,
    tgUserId: number,
  ) {
    const response = await xuiApi.addClientToInbound(location, {
      expiryTime,
      email,
      username,
      tgUserId
    })

    if (response.success) {
      const inbound = await xuiApi.getClients(location)
      return inbound
    }
  }

  private getVlessLinks(config: InboundResponse, location: Location): string[] {
    if (!config.obj) {
      return [];
    }

    const settings = JSON.parse(config.obj.settings);
    const streamSettings = JSON.parse(config.obj.streamSettings);

    if (config.obj.protocol === "vless" && settings.clients.length > 0) {
      const { port } = config.obj;
      const network = streamSettings.network;
      const security = streamSettings.security;
      const serverAddress = location.host;

      return settings.clients.map((client) => {
        const pbk = streamSettings.realitySettings.settings.publicKey;
        const sid = streamSettings.realitySettings.shortIds[0] || "";
        const sni = streamSettings.realitySettings.dest.split(":")[0];
        const spx = encodeURIComponent(streamSettings.realitySettings.settings.spiderX);
        const flow = client.flow || "";

        return `vless://${client.id}@${serverAddress}:${port}?type=${network}&security=${security}&pbk=${pbk}&fp=chrome&sni=${sni}&sid=${sid}&spx=${spx}&flow=${flow}#${client.email}`;
      });
    }

    return [];
  }

  private generateRandomEmail(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz1234567890';
    const domains: string[] = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

    const length: number = Math.floor(Math.random() * 10) + 5; // длина от 5 до 15 символов
    let email = '';

    for(let i = 0; i < length; i++) {
      email += chars[Math.floor(Math.random() * chars.length)];
    }

    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${email}@${domain}`;
  }

  async create(createConfigDto: CreateConfigDto) {
    let expiryTime: number;
    let promoCode: PromoCode | null = null;

    if (createConfigDto.isTrial) {
      expiryTime = Date.now() + 3 * 24 * 60 * 60 * 1000;
    } else {
      expiryTime = Date.now() + createConfigDto.months * 30 * 24 * 60 * 60 * 1000;
    }

    if (createConfigDto.promoCode && createConfigDto.promoCode !== "") {
      promoCode = await this.prisma.promoCode.findFirst({ where: { code: createConfigDto.promoCode } });
    }

    if (promoCode === null && createConfigDto.promoCode) {
      throw new Error('Promo code not found');
    }

    const email = this.generateRandomEmail();
    const location = await this.prisma.location.findFirst({ where: { id: createConfigDto.locationId } });

    console.log({ expiryTime })

    const config: any = await this.generateInbound(location, expiryTime, email, createConfigDto.name, createConfigDto.tgUserId);
    const vlessUrls = this.getVlessLinks(config, location);

    const data = await this.prisma.config.create({
      data: {
        tgUserId: Number(createConfigDto.tgUserId),
        name: createConfigDto.name,
        isTrial: createConfigDto.isTrial,
        config: JSON.stringify(config),
        expiryTime,
        vlessUrl: vlessUrls.find(url => url.includes(email)),
        locationId: location.id,
        promoCodeId: promoCode ? promoCode.id : null,
      },
      include: {
        promoCode: true,
        location: {
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
            coordinates: true,
          }
        }
      }
    });

    return {
      ...data,
      expiryTime: data.expiryTime.toString(),
      tgUserId: config.tgUserId ? config.tgUserId.toString() : null
    }
  }

  async findAll(tgUserId?: number) {
    const configs = await this.prisma.config.findMany({
      where: tgUserId ? { tgUserId } : undefined,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
            coordinates: true
          }
        }
      }
    });

    return configs.map(config => ({
      ...config,
      expiryTime: config.expiryTime.toString(),
      tgUserId: config.tgUserId ? config.tgUserId.toString() : null
    }));
  }

  async findOne(id: string) {
    const data = await this.prisma.config.findUnique({ where: { id }, include: {
      location: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true,
          coordinates: true
        }
      }
    }});

    return {
      ...data,
      expiryTime: data.expiryTime.toString(),
      tgUserId: data.tgUserId ? data.tgUserId.toString() : null
    }
  }

  async remove(id: string) {
    const data = await this.prisma.config.delete({ where: {id} })

    return {
      ...data,
      expiryTime: data.expiryTime.toString(),
      tgUserId: data.tgUserId ? data.tgUserId.toString() : null
    };
  }
}
