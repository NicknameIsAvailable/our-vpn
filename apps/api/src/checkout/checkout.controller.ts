import { Controller, Post, Body, Get, Param, Patch, Delete, Query } from '@nestjs/common';
import { CreateCheckoutDTO } from './dto/create-checkout.dto';
import { CheckoutService } from './checkout.service';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async create(@Body() createCheckoutDto: CreateCheckoutDTO) {
    return this.checkoutService.create(createCheckoutDto);
  }

  @Get()
  async findMany(@Query() filters: Partial<CreateCheckoutDTO>) {
    return this.checkoutService.findMany(filters);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.checkoutService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCheckoutDto: Partial<CreateCheckoutDTO>) {
    return this.checkoutService.update(id, updateCheckoutDto);
  }

  @Delete(':id')
  async deleteById(@Param('id') id: string) {
    return this.checkoutService.deleteById(id);
  }

  @Delete('/hook/:id')
  async deleteHookById(@Param('id') id: string) {
    return this.checkoutService.deleteHookById(id);
  }
}
