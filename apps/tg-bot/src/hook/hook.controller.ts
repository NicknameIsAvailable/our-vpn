import { Controller, Post, Body, Param } from '@nestjs/common';
import { HookService } from './hook.service';
import { SendConfigDto } from './dto/create-hook.dto';

@Controller('hook')
export class HookController {
  constructor(private readonly hookService: HookService) {}

  @Post("send-config")
  create(
    @Param() months: number,
    @Param() name: string,
    @Param() locationId: string,
    @Param() userId: string,
    @Param() price: number,
    @Param() isTrial: boolean,
    @Param() promoCode?: string,
    @Param() username?: string
  ) {
    return this.hookService.sendConfig({
      months,
      name,
      locationId,
      userId,
      price,
      isTrial,
      promoCode,
      username
    } satisfies SendConfigDto);
  }
}
