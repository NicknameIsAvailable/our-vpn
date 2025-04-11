import { Controller, Get, Post, Body, Param, Delete, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { CheckUserTrialAccess } from './decorators/check-user-trial-access.decorator';
import { CheckUserTrialAccessGuard } from './guards/check-user-trial-access/check-user-trial-access.guard';
import { TgUserData } from '../tg-user/decorators/tg-user-id.decorator';
import { TgUser } from '@prisma/client';

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  @UseGuards(CheckUserTrialAccessGuard)
  @CheckUserTrialAccess('tgUserId')
  // @Auth()
  async create(@TgUserData('user') user: TgUser, @Body() createConfigDto: CreateConfigDto) {
    const res = await this.configsService.create({...createConfigDto, tgUserId: String(user.id)})

    return {...res, config: JSON.parse(String(res.config))};
  }

  @Get()
  async findAll(@TgUserData('user') user?: TgUser) {
    const res = await this.configsService.findAll(user.id);
    return res;
  }

  @Get(':id')
  // @Auth()
  async findOne(@Param('id') id: string) {
    const res = await this.configsService.findOne(id)

    return {...res, config: JSON.parse(String(res.config))};
  }

  @Delete(':id')
  // @Auth()
  remove(@Param('id') id: string) {
    return this.configsService.remove(id);
  }
}
