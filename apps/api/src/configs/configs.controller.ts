import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { Auth } from '../auth/guards/decorators/auth.decorator';
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
  @Auth()
  async createCustom(@CurrentUser('id') userId, @Body() createConfigDto: CreateCustomConfigDto) {
    const res = await this.configsService.createCustom(userId, createConfigDto)
    return {...res, config: JSON.parse(String(res.config))};
  }

  @Get()
  @Auth()
  async findAll(@CurrentUser('id') userId) {
    const res = await this.configsService.findAll(userId)
    const formattedRes = res.map(item => ({...item, config: JSON.parse(String(item.config))}))
    return formattedRes;
  }

  @Get(':id')
  @Auth()
  async findOne(@CurrentUser('id') userId, @Param('id') id: string) {
    const res = await this.configsService.findOne(userId, id)

    return {...res, config: JSON.parse(String(res.config))};
  }

  @Delete(':id')
  @Auth()
  remove(@Param('id') id: string) {
    return this.configsService.remove(id);
  }
}
