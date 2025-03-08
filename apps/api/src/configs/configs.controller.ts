import { Controller, Get, Post, Body, Param, Delete, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { CheckUserTrialAccess } from './decorators/check-user-trial-access.decorator';
import { CheckUserTrialAccessGuard } from './guards/check-user-trial-access/check-user-trial-access.guard';

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  @UseGuards(CheckUserTrialAccessGuard)
  @CheckUserTrialAccess('userId')
  // @Auth()
  async create(@Body() createConfigDto: CreateConfigDto) {
    const res = await this.configsService.create(createConfigDto)

    return {...res, config: JSON.parse(String(res.config))};
  }

  @Get()
  async findAll(@Query("userId") userId?: string) {
    const res = await this.configsService.findAll(userId);
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
