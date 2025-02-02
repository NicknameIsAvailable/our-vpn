import { Injectable } from '@nestjs/common';
import MTProto from '@mtproto/core';
import { ConfigService } from '@nestjs/config';
import path from 'path';

@Injectable()
export class TelegramService {
  private mtproto: MTProto;

  constructor(private configService: ConfigService) {
    this.mtproto = new MTProto({
      api_id: Number(this.configService.get('TELEGRAM_API_ID')),
      api_hash: this.configService.get('TELEGRAM_API_HASH'),
      storageOptions: {
        path: path.resolve(__dirname, '../../storage/mtproto.json'),
      },
    });
  }

  async call(method: string, params: any) {
    try {
      return await this.mtproto.call(method, params);
    } catch (error) {
      console.error(`Telegram API Error: ${error}`);
      throw error;
    }
  }

  async getUserInfo() {
    return await this.call('users.getFullUser', {
      id: { _: 'inputUserSelf' },
    });
  }
}
