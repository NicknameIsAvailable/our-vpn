import { Controller, Get, Post, Body, Param, Delete, Query, BadRequestException } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { CurrentUser } from '../auth/guards/decorators/user.decorator';
import { CreateCustomConfigDto } from './dto/create-custom-config.dto';

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  // @Auth()
  async create(@Body() createConfigDto: CreateConfigDto) {
    const res = await this.configsService.create(createConfigDto)

    return {...res, config: JSON.parse(String(res.config))};
  }

  @Post('custom')
  // @Auth()
  async createCustom(@CurrentUser('id') userId, @Body() createConfigDto: CreateCustomConfigDto) {
    const res = await this.configsService.createCustom(userId, createConfigDto)
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
