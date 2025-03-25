import { Test, TestingModule } from '@nestjs/testing';
import { TgUserController } from './tg-user.controller';
import { TgUserService } from './tg-user.service';

describe('TgUserController', () => {
  let controller: TgUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TgUserController],
      providers: [TgUserService],
    }).compile();

    controller = module.get<TgUserController>(TgUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
