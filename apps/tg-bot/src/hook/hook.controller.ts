import { Controller, Post, Param, Query, Body } from '@nestjs/common';
import { HookService } from './hook.service';
import { SendConfigDto } from './dto/create-hook.dto';

@Controller('hook')
export class HookController {
  constructor(private readonly hookService: HookService) {}

  @Post("send-config")
  create(
    @Query() dto: SendConfigDto,
    @Body() paymentInfo: any,
  ) {
    console.log("send-config", { paymentInfo })

    return this.hookService.sendConfig(dto);
  }
}
