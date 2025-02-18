import { InboundResponse, xuiApi } from '@nash-vpn/xui';
import { Injectable } from '@nestjs/common';
import { CreateConfigDto } from './dto/create-config.dto';
import { PrismaService } from '@nash-vpn/db';
import { CreateCustomConfigDto } from './dto/create-custom-config.dto';
import { VlessConfig } from "types/vless"

@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateConfig(
    expiryTime: number,
    email: string,
  ) {
    const config = await xuiApi.addInbound({
      expiryTime,
      email,
      tgId: email
    })
    return config
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

  getVlessLinks(config: InboundResponse): string[] {
    if (!config.obj) {
      return [];
    }

    const settings = JSON.parse(config.obj.settings);
    const streamSettings = JSON.parse(config.obj.streamSettings);

    if (config.obj.protocol === "vless" && settings.clients.length > 0) {
      const { port } = config.obj;
      const network = streamSettings.network;
      const security = streamSettings.security;
      const serverAddress = process.env["XUI_HOST"];

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

  async create(createConfigDto: CreateConfigDto) {
    const expiryTime = Date.now() + createConfigDto.months * 30 * 24 * 60 * 60 * 1000
    const config: any = await this.generateConfig(expiryTime, createConfigDto.email);
    const vlessUrl = this.getVlessLinks(config);

    return this.prisma.config.create({
      data: {
        userId: String(createConfigDto.userId),
        name: createConfigDto.name,
        config: JSON.stringify(config.obj),
        vlessUrl: vlessUrl[0]
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

  async findAll(userId: string) {
    return this.prisma.config.findMany({ where: {userId} });
  }

  findOne(userId: string, id: string) {
    return this.prisma.config.findUnique({ where: { id, userId } });
  }

  remove(id: string) {
    return this.prisma.config.delete({ where: {id} });
  }
}
