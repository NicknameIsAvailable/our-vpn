import { Test, TestingModule } from '@nestjs/testing';
import { PromoCodeController } from './promo-code.controller';
import { PromoCodeService } from './promo-code.service';

describe('PromoCodeController', () => {
  let controller: PromoCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromoCodeController],
      providers: [PromoCodeService],
    }).compile();

    controller = module.get<PromoCodeController>(PromoCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
