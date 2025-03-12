import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ClientLocation } from "types/client-location"
import { Config } from '@prisma/client';
import { CreateConfigDto } from '../configs/dto/create-config.dto';

@Injectable()
export class ApiService {
  private readonly apiUrl = process.env.TELEGRAM_URL;

  constructor(private readonly httpService: HttpService) {}

  async sendConfig(dto: CreateConfigDto) {
    const url = `${this.apiUrl}/hook/send-config`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          data: dto
        })
      );
      return response.data;
    } catch (error) {
      console.error('Ошибка отправки конфигураций', error);
      return [];
    }
  }
}
