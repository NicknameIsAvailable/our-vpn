import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`[${req.method}] ${req.originalUrl}\n REQ: ${JSON.stringify(req.body)} \n RES: ${JSON.stringify(res.locals)}`);
    next();
  }
}
