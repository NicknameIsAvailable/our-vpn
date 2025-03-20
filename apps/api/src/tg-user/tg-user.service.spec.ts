import { Test, TestingModule } from '@nestjs/testing';
import { TgUserService } from './tg-user.service';

describe('TgUserService', () => {
  let service: TgUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TgUserService],
    }).compile();

    service = module.get<TgUserService>(TgUserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
