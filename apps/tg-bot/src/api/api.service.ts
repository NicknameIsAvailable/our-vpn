import { PromoCodeExtended } from 'types/promocode-extended';
import { TgUserFullData } from 'types/tg-user-full-data';
import { RatingItem } from 'types/rating-item';
import { ExtendedUserProgress } from 'types/extended-progress';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateConfig } from 'types/create-config';
import { ClientLocation } from 'types/client-location';
import { Config, Invoice, Level, PromoCode, TgUser, UserProgress } from '@prisma/client';
import { Checkout } from 'types/checkout';
import { IGetPaymentList, Payment } from '@a2seven/yoo-checkout';
import { MyContext } from '../types/my-context';

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
    if (!tgUserId) throw new Error('tgUserId не найден');

    const user = await this.getUser(ctx);
    console.log({ user });

    if (!user) {
      const isRegistered = await this.registerUser(ctx);
      if (!isRegistered) {
        throw new Error('Не удалось зарегистрировать пользователя');
      }
    }

    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${this.apiUrl}${url}`,
          data,
          params,
          headers: {
            // Authorization: `Bearer ${process.env.API_TOKEN}`,
            tguserid: tgUserId.toString(),
          },
        })
      );
      return response.data;
    } catch (error) {
      console.error(`Ошибка запроса [${method}] ${url}`, error);

      if (retry && error.response?.status === 401) {
        // const isRegistered = await this.registerUser(ctx);
        // if (isRegistered) {
          return this.request<T>(ctx, method, url, data, params, false);
        // }
      }

      return error;
    }
  }

  async getUserData(ctx: MyContext): Promise<TgUserFullData> {
    return this.request<TgUserFullData>(ctx, 'GET', '/v1/tg-user/me');
  }

  async getUserConfigs(ctx: MyContext): Promise<Config[]> {
    return (await this.request<Config[]>(ctx, 'GET', '/v1/configs', null, { userId: ctx.from.id })) || [];
  }

  async getConfigById(ctx: MyContext, id: string): Promise<Config | null> {
    return this.request<Config>(ctx, 'GET', `/v1/configs/${id}`);
  }

  async createConfig(ctx: MyContext, configData: CreateConfig): Promise<Config | null> {
    return this.request<Config>(ctx, 'POST', '/v1/configs', configData);
  }

  async getLocations(ctx: MyContext): Promise<ClientLocation[]> {
    return (await this.request<ClientLocation[]>(ctx, 'GET', '/v1/locations')) || [];
  }

  async createInvoice(ctx: MyContext, data: Checkout): Promise<{ payment: IGetPaymentList; data: Invoice } | null> {
    return this.request<{ payment: IGetPaymentList; data: Invoice }>(ctx, 'POST', '/v1/checkout', data);
  }

  async findInvoice(ctx: MyContext, id: string): Promise<{ data: Invoice; entity: Payment } | null> {
    return this.request<{ data: Invoice; entity: Payment }>(ctx, 'GET', `/v1/checkout/${id}`);
  }

  async updateInvoice(ctx: MyContext, id: string, data: Partial<Checkout>): Promise<Checkout | null> {
    return this.request<Checkout>(ctx, 'PATCH', `/v1/checkout/${id}`, data);
  }

  async deleteWebhookById(ctx: MyContext, id: string): Promise<boolean> {
    return (await this.request<boolean>(ctx, 'DELETE', `/v1/checkout/hook/${id}`)) ?? false;
  }

  async getUserProgresses(ctx: MyContext): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "GET", `/v1/progresses/`))
  }

  async createUserProgress(ctx: MyContext): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/progresses/`))
  }

  async createPromoCode(ctx: MyContext): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/progresses/`))
  }

  async savePromoCode(ctx: MyContext, id: string): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/promo-code/save/${id}`))
  }

  async usePromoCode(ctx: MyContext, id: string): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "POST", `/v1/promo-code/use/${id}`))
  }

  async getPromoCodeById(ctx: MyContext, id: string): Promise<PromoCode> {
    return (await this.request<PromoCode>(ctx, "GET", `/v1/promo-code/${id}`))
  }

  async getUserProgressById(ctx: MyContext, id?: string): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "GET", `/v1/progresses/${id}`))
  }

  async getMyProgress(ctx: MyContext): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "GET", "/v1/progresses/me"))
  }

  async getReferralSystemRating(ctx: MyContext): Promise<RatingItem[]> {
    return (await this.request<RatingItem[]>(ctx, "GET", "/v1/progresses/rating"))
  }

  async getLevels(ctx: MyContext): Promise<Level[]> {
    return (await this.request<Level[]>(ctx, "GET", "/v1/levels"))
  }

  async getLevelById(ctx: MyContext, id: string): Promise<Level> {
    return (await this.request<Level>(ctx, "GET", `/v1/levels/${id}`))
  }

  async getMyPromoCode(ctx: MyContext): Promise<PromoCode> {
    return (await this.request<PromoCode>(ctx, "GET", `/v1/promo-code/my`))
  }

  async getPromoCodeByCode(ctx: MyContext, code: string): Promise<PromoCodeExtended> {
    return (await this.request<PromoCodeExtended>(ctx, "GET", `/v1/promo-code/code/${code}`))
  }

  async upgradeLevel(ctx: MyContext): Promise<ExtendedUserProgress> {
    return (await this.request<ExtendedUserProgress>(ctx, "PATCH", `/v1/progresses/upgrade`))
  }

  async createMyPromoCode(ctx: MyContext): Promise<PromoCode> {
    return (await this.request<PromoCode>(ctx, "POST", `/v1/promo-code/my`))
  }
}
