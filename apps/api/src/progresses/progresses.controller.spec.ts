import { Test, TestingModule } from '@nestjs/testing';
import { ProgressesController } from './progresses.controller';
import { ProgressesService } from './progresses.service';

describe('ProgressesController', () => {
  let controller: ProgressesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressesController],
      providers: [ProgressesService],
    }).compile();

    controller = module.get<ProgressesController>(ProgressesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
