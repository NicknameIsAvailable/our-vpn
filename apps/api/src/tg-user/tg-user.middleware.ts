import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TgUserService } from './tg-user.service';

export class TgUserMiddleware implements NestMiddleware {
  constructor(private readonly tgUserService: TgUserService) {}

  use(req: any, res: Response, next: NextFunction) {
    req.locals = req.locals || {};
    req.locals.tgUserService = this.tgUserService;
    next();
  }
}
