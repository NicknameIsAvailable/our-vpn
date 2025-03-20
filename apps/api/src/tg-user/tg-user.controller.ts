import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { TgUserService } from './tg-user.service';
import { CreateTgUserDto } from './dto/create-tg-user.dto';
import { TgUserId } from './decorators/tg-user-id.decorator';

@Controller('tg-user')
export class TgUserController {
  constructor(private readonly tgUserService: TgUserService) {}

  @Post()
  create(@Body() createTgUserDto: CreateTgUserDto) {
    return this.tgUserService.create(createTgUserDto);
  }

  @Get()
  findAll(@Query() filters: Partial<CreateTgUserDto>) {
    return this.tgUserService.findAll(filters);
  }

  @Get('me')
  findMe(@TgUserId() id: number) {
    return this.tgUserService.findOne(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tgUserService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTgUserDto: UpdateTgUserDto) {
  //   return this.tgUserService.update(+id, updateTgUserDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tgUserService.remove(+id);
  }
}
