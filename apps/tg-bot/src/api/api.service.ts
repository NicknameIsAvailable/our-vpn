import { Checkout } from 'types/checkout';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ClientLocation } from "types/client-location"
import { Config, Invoice } from '@prisma/client';
import { SendConfigDto } from '../hook/dto/create-hook.dto';
import { IGetPaymentList } from '@a2seven/yoo-checkout';

@Injectable()
export class ApiService {
  private readonly apiUrl = process.env.API_URL;

  constructor(private readonly httpService: HttpService) {}

  async authenticateUser(email: string, password: string) {
    const url = `${this.apiUrl}/v1/auth/login`;
    try {
      const response = await firstValueFrom(this.httpService.post(url, { email, password }));
      return response.data;
    } catch (error) {
      console.error('Ошибка авторизации', error);
      return null;
    }
  }

  async getUserConfigs(userId: string): Promise<Config[]> {
    const url = `${this.apiUrl}/v1/configs`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            userId
          }
        })
      );
      return response.data as Config[];
    } catch (error) {
      console.error('Ошибка получения конфигураций', error);
      return [];
    }
  }

  async getConfigById(id: string): Promise<Config> {
    const url = `${this.apiUrl}/v1/configs/${id}`
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
        })
      )
      return response.data
    } catch (error) {
      console.error('Ошибка при получении конфига: ', error)
      return null
    }
  }

  async createConfig(configData: SendConfigDto) {
    const url = `${this.apiUrl}/v1/configs`;
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, configData, {
          headers: { Authorization: `Bearer ${process.env.API_TOKEN}` },
        })
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка создания конфига', error);
      return error;
    }
  }

  async getLocations(): Promise<ClientLocation[]> {
    const url = `${this.apiUrl}/v1/locations`
    try {
      const response = await firstValueFrom(
        this.httpService.get(url)
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка создания конфига', error);
      return null;
    }
  }

  async createInvoice(data: Checkout): Promise<{ payment: IGetPaymentList, data: Invoice}> {
    const url = `${this.apiUrl}/v1/checkout`

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data)
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка создания инвойса', error);
      return null;
    }
  }
}
