import { PrismaModule } from '@nash-vpn/db';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LocationsModule } from '../locations/locations.module';
import { ConfigsModule } from '../configs/configs.module';
import { TelegramModule } from '../telegram/telegram.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    LocationsModule,
    ConfigsModule,
    TelegramModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
