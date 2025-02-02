import { Injectable } from '@nestjs/common';
import { CreateConfigDto } from './dto/create-config.dto';
import { VlessConfig } from './entities/config.entity';
import { randomUUID } from 'crypto';
import { PrismaService } from '@nash-vpn/db';
import { CreateCustomConfigDto } from './dto/create-custom-config.dto';
import { CurrentUser } from '../auth/guards/decorators/user.decorator';

@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  generateConfig(
    uuid: string,
    email: string,
    excludedDomains: string[]
  ): VlessConfig {
    return {
      log: {
        access: "/var/log/xray/access.log",
        error: "/var/log/xray/error.log",
        loglevel: "info",
      },
      inbounds: [
        {
          port: 443,
          protocol: "vless",
          settings: {
            clients: [
              {
                id: uuid,
                email: email,
              },
            ],
            decryption: "none",
          },
          streamSettings: {
            network: "ws",
            wsSettings: {
              path: "/vless",
            },
            security: "tls",
          },
        },
      ],
      outbounds: [
        {
          protocol: "freedom",
          settings: {},
        },
        {
          protocol: "blackhole",
          settings: {},
          tag: "blocked",
        },
      ],
      routing: {
        rules: [
          {
            type: "field",
            domain: excludedDomains,
            outboundTag: "freedom",
          },
        ],
      },
    }
  }

  parseVlessUrl(vlessUrl: string): VlessConfig {
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
                email: 'iamgenii@yandex.ru',  // Можете передать email динамически
              },
            ],
            decryption: 'none',
          },
          streamSettings: {
            network: network,
            wsSettings: {
              path: decodeURIComponent(path),  // Декодируем путь
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

  getVlessLinks(config: VlessConfig): string[] {
    const links: string[] = [];

    config.inbounds.forEach((inbound) => {
      const { port, protocol, settings, streamSettings } = inbound;

      if (protocol === "vless" && settings.clients.length > 0) {
        settings.clients.forEach((client) => {
          const uuid = client.id;
          const network = streamSettings.network;
          const path = streamSettings.wsSettings?.path || "";
          const security = streamSettings.security;

          const link = `vless://${uuid}@${config.log.access}:${port}?type=${network}&security=${security}&path=${encodeURIComponent(
            path
          )}`;
          links.push(link);
        });
      }
    });

    return links;
  }

  create(userId: string, createConfigDto: CreateConfigDto) {
    const configId = randomUUID();
    const config = this.generateConfig(configId, createConfigDto.email, []);
    const vlessUrl = this.getVlessLinks(config);

    return this.prisma.config.create({
      data: {
        userId,
        name: createConfigDto.name,
        config: JSON.stringify(config),
        vlessUrl: vlessUrl[0]
      },
      include: {
        user: true
      }
    });
  }

  async createCustom(userId: string, dto: CreateCustomConfigDto) {
    const config = this.parseVlessUrl(dto.url)
    const data = await this.prisma.config.create({ data: {
      userId,
      vlessUrl: dto.url,
      name: dto.name,
      config: JSON.stringify(config),
    }})
    return data
  }

  findAll(userId: string) {
    return this.prisma.config.findMany({ where: {userId} });
  }

  findOne(userId: string, id: string) {
    return this.prisma.config.findUnique({ where: { id, userId } });
  }

  remove(id: string) {
    return this.prisma.config.delete({ where: {id} });
  }
}
