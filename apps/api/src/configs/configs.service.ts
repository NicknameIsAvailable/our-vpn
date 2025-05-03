import { InboundResponse, xuiApi, XUIConfig } from '@nash-vpn/xui';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@nash-vpn/db';
import { Location, PromoCode } from "@prisma/client";
import { parseXUIConfig } from '@nash-vpn/xui';
import { CreateConfigRequestDto } from './dto/create-config.dto';
import { ExtendConfigDto } from './dto/extend-config.dto';
import { generateRandomString } from 'functions/generate-random-string';
@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateInbound(
    location: Location,
    expiryTime: number,
    email: string,
    username: string,
    tgUserId: string,
  ): Promise<InboundResponse> {
    const response = await xuiApi.addClientToInbound(location, {
      expiryTime,
      email,
      username,
      tgUserId
    })

    if (response?.success) {
      const inbound = await xuiApi.getClients(location)
      return inbound
    }
    throw new Error('Failed to generate inbound');
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

  async create(createConfigDto: CreateConfigRequestDto) {
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

    const email = `${createConfigDto.username ? createConfigDto.username : createConfigDto.tgUserId}-${createConfigDto.months}m-${generateRandomString(8)}@our-vpn.pro`;
    const location = await this.prisma.location.findFirst({ where: { id: createConfigDto.locationId } });

    const config: InboundResponse = await this.generateInbound(location, expiryTime, email, createConfigDto.name, createConfigDto.tgUserId);

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
            label: true,
            comment: true,
          }
        }
      }
    });

    return {
      ...data,
      expiryTime: data.expiryTime.toString(),
      tgUserId: data.tgUserId ? data.tgUserId.toString() : null
    }
  }

  async findAll(tgUserId?: bigint) {
    const configs = await this.prisma.config.findMany({
      where: tgUserId ? { tgUserId } : undefined,
      include: {
        location: {
          select: {
            id: true,
            name: true,
            comment: true,
            country: true,
            city: true,
            coordinates: true,
            label: true,
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
          coordinates: true,
          label: true,
          comment: true,
        }
      }
    }});

    console.log({ config: parseXUIConfig(data.config) })

    return {
      ...data,
      config: parseXUIConfig(data.config),
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

  async extend(id: string, tgUserId: bigint, extendConfigDto: ExtendConfigDto) {
    const config = await this.prisma.config.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!config) {
      throw new Error('Конфиг не найден');
    }

    console.log({ config, tgUserId })

    if (config.tgUserId.toString() !== tgUserId.toString()) {
      throw new Error('У вас нет доступа к этому конфигу');
    }

    let daysToAdd: number;

    if (extendConfigDto.useAccumulatedDays) {
      const userProgress = await this.prisma.userProgress.findUnique({
        where: { tgUserId }
      });

      if (!userProgress) {
        throw new Error('Информация о прогрессе пользователя не найдена');
      }

      if (userProgress.accumulatedDays <= 0) {
        throw new Error('У вас нет накопленных дней для продления');
      }

      daysToAdd = extendConfigDto.days;

      await this.prisma.userProgress.update({
        where: { id: userProgress.id },
        data: {
          accumulatedDays: {
            decrement: daysToAdd
          }
        }
      });
    } else {
      if (extendConfigDto.months) {
        daysToAdd = extendConfigDto.months * 30;
      } else if (extendConfigDto.days) {
        daysToAdd = extendConfigDto.days;
      } else {
        throw new Error('Необходимо указать количество дней или месяцев для продления');
      }
    }

    const currentTime = Date.now();
    const configExpiryTime = Number(config.expiryTime);

    const newExpiryTime = configExpiryTime < currentTime
      ? currentTime + (daysToAdd * 24 * 60 * 60 * 1000)
      : configExpiryTime + (daysToAdd * 24 * 60 * 60 * 1000);

    const XUIConfig = parseXUIConfig(config.config);
    const updateXuiClient = await xuiApi.updateClient(config.location, XUIConfig.settings.clients[0].id, {
      expiryTime: newExpiryTime,
      enabled: newExpiryTime > currentTime
    })

    const updatedConfig = await this.prisma.config.update({
      where: { id },
      data: {
        expiryTime: BigInt(newExpiryTime)
      },
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

    return {
      ...updatedConfig,
      expiryTime: updatedConfig.expiryTime.toString(),
      tgUserId: updatedConfig.tgUserId ? updatedConfig.tgUserId.toString() : null,
      daysAdded: daysToAdd,
      updateXuiClient
    };
  }
}
