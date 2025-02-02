import { Injectable } from '@nestjs/common';
import { Router } from "express"

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: '💪 Наш ВПН работает!' };
  }
}
