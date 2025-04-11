import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      const result = await next(params);

      if (Array.isArray(result)) {
        return result.map(item => this.convertBigIntFieldsToString(item));
      } else {
        return this.convertBigIntFieldsToString(result);
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private convertBigIntFieldsToString(obj: any): any {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'bigint') {
          obj[key] = obj[key].toString();
        } else if (typeof obj[key] === 'object') {
          obj[key] = this.convertBigIntFieldsToString(obj[key]);
        }
      }
    }
    return obj;
  }
}
