import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProgressesService } from './progresses.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { TgUserId } from '../tg-user/decorators/tg-user-id.decorator';
import { Auth } from '../auth/guards/decorators/auth.decorator';

@Controller('progresses')
export class ProgressesController {
  constructor(private readonly progressesService: ProgressesService) {}

  @Post()
  create(@TgUserId() tgUserId: number) {
    return this.progressesService.create(tgUserId);
  }

  @Get()
  findAll(@TgUserId() tgUserId: number) {
    console.log({ tgUserId })
    return this.progressesService.findAll(tgUserId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.progressesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProgressDto: UpdateProgressDto) {
    return this.progressesService.update(id, updateProgressDto);
  }

  @Auth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.progressesService.remove(id);
  }
}
