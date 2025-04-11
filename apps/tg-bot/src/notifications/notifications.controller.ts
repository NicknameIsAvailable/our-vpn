import { Controller, Post, Body, } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationDto } from './dto/create-notification.dto';
import { NotifyReferralDto } from './dto/notify-referral';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: NotificationDto) {
    return this.notificationsService.notifyUsers(createNotificationDto.message, createNotificationDto.userIds);
  }

  @Post('referral')
  referral(@Body() notifyReferralDto: NotifyReferralDto) {
    return this.notificationsService.notifyReferral(notifyReferralDto);
  }
}
