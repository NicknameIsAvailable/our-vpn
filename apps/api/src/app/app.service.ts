import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: '💪 Наш ВПН работает!' };
  }
}
