import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PromoCodeService } from './promo-code.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';

@Controller('promo-code')
export class PromoCodeController {
  constructor(private readonly promoCodeService: PromoCodeService) {}

  @Post()
  create(@Body() createPromoCodeDto: CreatePromoCodeDto) {
    return this.promoCodeService.create(createPromoCodeDto);
  }

  @Get()
  findAll(@Query('id') id: string, @Query('code') code: string, @Query('name') name: string) {
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

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePromoCodeDto: UpdatePromoCodeDto) {
    return this.promoCodeService.update(id, updatePromoCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promoCodeService.remove(id);
  }
}
