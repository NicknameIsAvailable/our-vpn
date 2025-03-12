import { InboundResponse, xuiApi } from '@nash-vpn/xui';
import { Injectable } from '@nestjs/common';
import { CreateConfigDto } from './dto/create-config.dto';
import { PrismaService } from '@nash-vpn/db';
import { VlessConfig } from "types/vless"
import { Location, PromoCode } from "@prisma/client";

@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateConfig(
    location: Location,
    expiryTime: number,
    email: string,
    username: string
  ) {
    const response = await xuiApi.addClientToInbound(location, {
      expiryTime,
      email,
      username,
      tgId: ""
    })

    if (response.success) {
      const inbound = await xuiApi.getClients(location)
      return inbound
    }
  }

  private parseVlessUrl(vlessUrl: string): VlessConfig {
    const regex = /^vless:\/\/([a-f0-9-]{36})@([^:]+):(\d+)\?type=([a-z]+)&security=([a-z]+)&path=(.*)$/;
    const match = vlessUrl.match(regex);

    if (!match) {
      throw new Error('Invalid VLESS URL');
    }

    const [_, uuid, accessLog, port, network, security, path] = match;

    const config: VlessConfig = {
      log: {
        access: accessLog,
        error: '/var/log/xray/error.log',
        loglevel: 'info',
      },
      inbounds: [
        {
          port: parseInt(port, 10),
          protocol: 'vless',
          settings: {
            clients: [
              {
                id: uuid,
                email: 'iamgenii@yandex.ru',
              },
            ],
            decryption: 'none',
          },
          streamSettings: {
            network: network,
            wsSettings: {
              path: decodeURIComponent(path),
            },
            security: security,
          },
        },
      ],
      outbounds: [
        {
          protocol: 'freedom',
          settings: {},
        },
        {
          protocol: 'blackhole',
          settings: {},
          tag: 'blocked',
        },
      ],
      routing: {
        rules: [
          {
            type: 'field',
            domain: [],
            outboundTag: 'freedom',
          },
        ],
      },
    };

    return config;
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

    const config: any = await this.generateConfig(location, expiryTime, email, createConfigDto.name);
    const vlessUrls = this.getVlessLinks(config, location);

    return this.prisma.config.create({
      data: {
        userId: String(createConfigDto.userId),
        username: createConfigDto.username || `anon-${createConfigDto.userId}`,
        name: createConfigDto.name,
        isTrial: createConfigDto.isTrial,
        config: JSON.stringify(config),
        vlessUrl: vlessUrls.find(url => url.includes(email)),
        locationId: location.id,
        promoCodeId: promoCode ? promoCode.id : null,  // Если промокод найден, передаем его ID
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
  }

  async findAll(userId?: string) {
    return this.prisma.config.findMany({
      where: userId ? { userId } : undefined,
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
  }

  findOne(id: string) {
    return this.prisma.config.findUnique({ where: { id }, include: {
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
  }

  remove(id: string) {
    return this.prisma.config.delete({ where: {id} });
  }
}
