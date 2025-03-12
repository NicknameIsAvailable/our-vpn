import { PrismaModule } from '@nash-vpn/db';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocationsModule } from '../locations/locations.module';
import { ConfigsModule } from '../configs/configs.module';
import { TelegramModule } from '../telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { LoggerMiddleware } from '../logger/logger.middleware';
import { APP_GUARD } from '@nestjs/core';
import { CheckUserTrialAccessGuard } from '../configs/guards/check-user-trial-access/check-user-trial-access.guard';
import { PromoCodeModule } from '../promo-code/promo-code.module';
import { CheckoutModule } from '../checkout/checkout.module';

@Module({
  imports: [
    PrismaModule,
    LocationsModule,
    ConfigsModule,
    TelegramModule,
    PromoCodeModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    CheckoutModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: CheckUserTrialAccessGuard,
  }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*")
  }
}
