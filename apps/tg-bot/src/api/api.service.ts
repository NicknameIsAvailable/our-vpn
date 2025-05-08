import { ExtendConfigResponse } from 'types/dto/config-dto/response/extend-config-response';
import { PromoCodeExtended } from 'types/promocode-extended';
import { TgUserFullData } from 'types/tg-user-full-data';
import { RatingItem } from 'types/rating-item';
import { ExtendedUserProgress } from 'types/extended-progress';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateConfig } from 'types/create-config';
import { ClientLocation } from 'types/client-location';
import { Config, Invoice, Level, PromoCode, TgUser } from '@prisma/client';
import { Checkout } from 'types/checkout';
import { IGetPaymentList, Payment } from '@a2seven/yoo-checkout';
import { MyContext } from '../types/my-context';
import { ExtendedConfig } from 'types/extended-config';
import { ExtendConfigDto } from 'types/dto/config-dto/request/extend-config-dto';

@Injectable()
export class ApiService {
  private readonly apiUrl = process.env.API_URL;

  constructor(private readonly httpService: HttpService) {}

  private async registerUser(ctx: MyContext): Promise<boolean> {
    const tgUserId = ctx.from?.id;
    if (!tgUserId) return false;

    try {
      await firstValueFrom(
        this.httpService.post(`${this.apiUrl}/v1/tg-user`, {
          id: tgUserId,
          username: ctx.from?.username || '',
        })
      );
      return true;
    } catch (error) {
      console.error('Ошибка регистрации пользователя через API:', error);
      return false;
    }
  }

  private async getUser(ctx: MyContext): Promise<Partial<TgUser> | null> {
    const tgUserId = ctx.from?.id;
    if (!tgUserId) return null;

    try {
      const response = await firstValueFrom(
        this.httpService.get<{ id: bigint; username: string; created_at: Date; updated_at: Date }>(
          `${this.apiUrl}/v1/tg-user/me`,
          {
            headers: {
              tguserid: tgUserId.toString(),
            },
          }
        )
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка получения пользователя через API:', error);
      return null;
    }
  }

  private async request<T>(
    ctx: MyContext,
    method: string,
    url: string,
    data?: any,
    params?: any,
    retry = true
  ): Promise<T | null> {
    const tgUserId = ctx.from?.id;
    if (!tgUserId) return null;

    const user = await this.getUser(ctx);
    if (!user) {
      const isRegistered = await this.registerUser(ctx);
      if (!isRegistered) return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${this.apiUrl}${url}`,
          data,
          params,
          headers: {
            tguserid: tgUserId.toString(),
          },
        })
      );
      return response.data;
    } catch (error) {
      console.error(`Ошибка запроса [${method}] ${url}`, error);

      if (retry && error.response?.status === 401) {
        return this.request<T>(ctx, method, url, data, params, false);
      }

      return null;
    }
  }

  async getUserData(ctx: MyContext): Promise<TgUserFullData | null> {
    try {
      return await this.request<TgUserFullData>(ctx, 'GET', '/v1/tg-user/me');
    } catch (e) {
      console.error('getUserData error:', e);
      return null;
    }
  }

  async getUserConfigs(ctx: MyContext): Promise<Config[]> {
    try {
      return (await this.request<Config[]>(ctx, 'GET', '/v1/configs', null, { userId: ctx.from.id })) || [];
    } catch (e) {
      console.error('getUserConfigs error:', e);
      return [];
    }
  }

  async getConfigById(ctx: MyContext, id: string): Promise<ExtendedConfig | null> {
    try {
      return await this.request<ExtendedConfig>(ctx, 'GET', `/v1/configs/${id}`);
    } catch (e) {
      console.error('getConfigById error:', e);
      return null;
    }
  }

  async extendConfig(ctx: MyContext, id: string, extendConfigDto: ExtendConfigDto): Promise<ExtendConfigResponse | null> {
    try {
      return await this.request<ExtendConfigResponse>(ctx, 'POST', `/v1/configs/${id}/extend`, extendConfigDto);
    } catch (e) {
      console.error('extendConfig error:', e);
      return null;
    }
  }

  async createConfig(ctx: MyContext, configData: CreateConfig): Promise<Config | null> {
    try {
      return await this.request<Config>(ctx, 'POST', '/v1/configs', configData);
    } catch (e) {
      console.error('createConfig error:', e);
      return null;
    }
  }

  async getLocationById(ctx: MyContext, id: string): Promise<ClientLocation | null> {
    try {
      return await this.request<ClientLocation>(ctx, 'GET', `/v1/locations/${id}`);
    } catch (e) {
      console.error('getLocationById error:', e);
      return null;
    }
  }

  async getLocations(ctx: MyContext): Promise<ClientLocation[]> {
    try {
      return (await this.request<ClientLocation[]>(ctx, 'GET', '/v1/locations')) || [];
    } catch (e) {
      console.error('getLocations error:', e);
      return [];
    }
  }

  async createInvoice(ctx: MyContext, data: Checkout): Promise<{ payment: IGetPaymentList; data: Invoice } | null> {
    try {
      return await this.request<{ payment: IGetPaymentList; data: Invoice }>(ctx, 'POST', '/v1/checkout', data);
    } catch (e) {
      console.error('createInvoice error:', e);
      return null;
    }
  }

  async findInvoice(ctx: MyContext, id: string): Promise<{ data: Invoice; entity: Payment } | null> {
    try {
      return await this.request<{ data: Invoice; entity: Payment }>(ctx, 'GET', `/v1/checkout/${id}`);
    } catch (e) {
      console.error('findInvoice error:', e);
      return null;
    }
  }

  async updateInvoice(ctx: MyContext, id: string, data: Partial<Checkout>): Promise<Checkout | null> {
    try {
      return await this.request<Checkout>(ctx, 'PATCH', `/v1/checkout/${id}`, data);
    } catch (e) {
      console.error('updateInvoice error:', e);
      return null;
    }
  }

  async deleteWebhookById(ctx: MyContext, id: string): Promise<boolean> {
    try {
      return (await this.request<boolean>(ctx, 'DELETE', `/v1/checkout/hook/${id}`)) ?? false;
    } catch (e) {
      console.error('deleteWebhookById error:', e);
      return false;
    }
  }

  async getUserProgresses(ctx: MyContext): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "GET", `/v1/progresses/`);
    } catch (e) {
      console.error('getUserProgresses error:', e);
      return null;
    }
  }

  async createUserProgress(ctx: MyContext): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/progresses/`);
    } catch (e) {
      console.error('createUserProgress error:', e);
      return null;
    }
  }

  async createPromoCode(ctx: MyContext): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/progresses/`);
    } catch (e) {
      console.error('createPromoCode error:', e);
      return null;
    }
  }

  async savePromoCode(ctx: MyContext, id: string): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/promo-code/save/${id}`);
    } catch (e) {
      console.error('savePromoCode error:', e);
      return null;
    }
  }

  async usePromoCode(ctx: MyContext, id: string): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/promo-code/use/${id}`);
    } catch (e) {
      console.error('usePromoCode error:', e);
      return null;
    }
  }

  async getPromoCodeById(ctx: MyContext, id: string): Promise<PromoCode | null> {
    try {
      return await this.request<PromoCode>(ctx, "GET", `/v1/promo-code/${id}`);
    } catch (e) {
      console.error('getPromoCodeById error:', e);
      return null;
    }
  }

  async getUserProgressById(ctx: MyContext, id?: string): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "GET", `/v1/progresses/${id}`);
    } catch (e) {
      console.error('getUserProgressById error:', e);
      return null;
    }
  }

  async getMyProgress(ctx: MyContext): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "GET", "/v1/progresses/me");
    } catch (e) {
      console.error('getMyProgress error:', e);
      return null;
    }
  }

  async getReferralSystemRating(ctx: MyContext): Promise<RatingItem[] | null> {
    try {
      return await this.request<RatingItem[]>(ctx, "GET", "/v1/progresses/rating");
    } catch (e) {
      console.error('getReferralSystemRating error:', e);
      return null;
    }
  }

  async getLevels(ctx: MyContext): Promise<Level[] | null> {
    try {
      return await this.request<Level[]>(ctx, "GET", "/v1/levels");
    } catch (e) {
      console.error('getLevels error:', e);
      return null;
    }
  }

  async getLevelById(ctx: MyContext, id: string): Promise<Level | null> {
    try {
      return await this.request<Level>(ctx, "GET", `/v1/levels/${id}`);
    } catch (e) {
      console.error('getLevelById error:', e);
      return null;
    }
  }

  async getMyPromoCode(ctx: MyContext): Promise<PromoCode | null> {
    try {
      return await this.request<PromoCode>(ctx, "GET", `/v1/promo-code/my`);
    } catch (e) {
      console.error('getMyPromoCode error:', e);
      return null;
    }
  }

  async getPromoCodeByCode(ctx: MyContext, code: string): Promise<PromoCodeExtended | null> {
    try {
      return await this.request<PromoCodeExtended>(ctx, "GET", `/v1/promo-code/code/${code}`);
    } catch (e) {
      console.error('getPromoCodeByCode error:', e);
      return null;
    }
  }

  async upgradeLevel(ctx: MyContext): Promise<ExtendedUserProgress | null> {
    try {
      return await this.request<ExtendedUserProgress>(ctx, "PATCH", `/v1/progresses/upgrade`);
    } catch (e) {
      console.error('upgradeLevel error:', e);
      return null;
    }
  }

  async createMyPromoCode(ctx: MyContext): Promise<PromoCode | null> {
    try {
      return await this.request<PromoCode>(ctx, "POST", `/v1/promo-code/my`);
    } catch (e) {
      console.error('createMyPromoCode error:', e);
      return null;
    }
  }
}
