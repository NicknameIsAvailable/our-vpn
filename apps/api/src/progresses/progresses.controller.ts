import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProgressesService } from './progresses.service';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { TgUserData } from '../tg-user/decorators/tg-user-id.decorator';
import { Auth } from '../auth/guards/decorators/auth.decorator';
import { TgUser } from '@prisma/client';

@Controller('progresses')
export class ProgressesController {
  constructor(private readonly progressesService: ProgressesService) {}

  @Post()
  create(@TgUserData('user') user: TgUser) {
    return this.progressesService.create(user.id);
  }

  @Get()
  findAll(@TgUserData('user') user: TgUser) {
    return this.progressesService.findAll(user.id);
  }

  @Get('rating')
  getReferralRating() {
    return this.progressesService.getReferralRating();
  }

  @Get('me')
  findMe(@TgUserData('id') tgUser: TgUser) {
    return this.progressesService.findMe(tgUser.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.progressesService.findOne(id);
  }

  @Patch('upgrade')
  upgrade(@TgUserData('user') user: TgUser) {
    return this.progressesService.upgrade(user.id);
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
