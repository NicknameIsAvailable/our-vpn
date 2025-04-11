import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { TgUserData } from '../tg-user/decorators/tg-user-id.decorator';
import { TgUserFullData } from 'types/tg-user-full-data';
import { TgUser } from '@prisma/client';

@Controller('promo-code')
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Post()
  create(@Body() createPromoCodeDto: CreatePromoCodeDto, @TgUserData('user') user: TgUserFullData) {
    return this.promoCodeService.create(createPromoCodeDto, user);
  }

  @Get()
  findAll() {
    return this.promoCodeService.findAll();
  }

  @Get(':id')
  findAllWithFilters(@Param('id') id: string, @Query('code') code: string, @Query('name') name: string) {
    console.log(id, code, name);

    const filters: { id?: string, code?: string, name?: string } = {};

    if (id) filters.id = id;
    if (code) filters.code = code;
    if (name) filters.name = name;

    if (Object.keys(filters).length) {
      return this.promoCodeService.findOne(filters);
    }

    return this.promoCodeService.findAll();
  }

  @Get('my')
  findMy(@TgUserData() tgUserId: TgUser) {
    return this.promoCodeService.findMy(tgUserId.id)
  }

  @Get('saved')
  getSavedPromoCodes(@TgUserData() tgUser: TgUserFullData) {
    return this.promoCodeService.getSavedPromoCodes(BigInt(tgUser.id))
  }

  @Post('my')
  createUserPromoCode(@TgUserData() tgUser: TgUserFullData) {
    return this.promoCodeService.createUserPromoCode(tgUser)
  }

  @Post('save/:id')
  savePromoCode(@TgUserData() tgUser: TgUserFullData, @Param('id') promoCodeId: string) {
    return this.promoCodeService.savePromoCode(BigInt(tgUser.id), promoCodeId)
  }

  @Post('use/:id')
  usePromoCode(@TgUserData() tgUser: TgUserFullData, @Param('id') promoCodeId: string) {
    return this.promoCodeService.usePromoCode(BigInt(tgUser.id), promoCodeId)
  }

  @Delete('remove-saved/:id')
  removeSavedPromoCode(@TgUserData() tgUser: TgUserFullData, @Param('id') promoCodeId: string) {
      return this.promoCodeService.removeSavedPromoCode(BigInt(tgUser.id), promoCodeId);
  }

  @Delete('remove-used/:id')
  removeUsedPromoCode(@TgUserData() tgUser: TgUserFullData, @Param('id') promoCodeId: string) {
      return this.promoCodeService.removeUsedPromoCode(BigInt(tgUser.id), promoCodeId);
  }

  @Get('code/:code')
  findByCode(@Param() params: { code: string }) {
    return this.promoCodeService.findByCode(params)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePromoCodeDto: UpdatePromoCodeDto) {
    return this.promoCodeService.update(id, updatePromoCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoCodeService.remove(id);
  }
}
