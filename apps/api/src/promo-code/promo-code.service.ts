import { Injectable } from '@nestjs/common';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PrismaService } from '@nash-vpn/db';

@Injectable()
export class PromoCodeService {
  constructor(private readonly prisma: PrismaService) {}

  create(createPromoCodeDto: CreatePromoCodeDto) {
    return this.prisma.promoCode.create({ data: createPromoCodeDto })
  }

  findAll() {
    return this.prisma.promoCode.findMany()
  }

  findOne(params: { id?: string, code?: string, name?: string }) {
    return this.prisma.promoCode.findFirst({
      where: {
        AND: [
          params.id ? { id: params.id } : {},
          params.code ? { code: params.code } : {},
          params.name ? { name: params.name } : {}
        ]
      }
    });
  }

  update(id: string, updatePromoCodeDto: UpdatePromoCodeDto) {
    return this.prisma.promoCode.update({ data: updatePromoCodeDto, where: {id} });
  }

  remove(id: string) {
    return this.prisma.promoCode.delete({ where: { id } });
  }
}
