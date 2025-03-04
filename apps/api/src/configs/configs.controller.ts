import { Controller, Get, Post, Body, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  // @Auth()
  async create(@Body() createConfigDto: CreateConfigDto) {
    const res = await this.configsService.create(createConfigDto)

    return {...res, config: JSON.parse(String(res.config))};
  }

  @Get()
  async findAll(@Query("userId") userId?: string) {
    if (!userId) {
      throw new BadRequestException("userId is required");
    }

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
