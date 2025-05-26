import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { NotifyReferralDtoInterface } from 'types/notify-referral';
@Injectable()
export class ApiService {
  private readonly apiUrl = process.env.TELEGRAM_URL;

  constructor(private readonly httpService: HttpService) {}

  async notifyReferral(notifyReferralDto: NotifyReferralDtoInterface) {
    const url = `${this.apiUrl}/notifications/referral`;
    try {
      const response = await this.httpService.post(url, notifyReferralDto).toPromise();
      return response.data;
    } catch (error) {
      console.error("Error sending referral notification:", error.response?.data || error.message);
      throw error;
    }
  }
}
