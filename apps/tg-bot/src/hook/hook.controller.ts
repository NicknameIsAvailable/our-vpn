import { Controller, Post, Body } from '@nestjs/common';
import { HookService } from './hook.service';
import { SendConfigDto } from './dto/create-hook.dto';

@Controller('hook')
export class HookController {
  constructor(private readonly hookService: HookService) {}

  @Post("send-config")
  create(@Body() sendConfigDto: SendConfigDto) {
    return this.hookService.sendConfig(sendConfigDto);
  }
}
