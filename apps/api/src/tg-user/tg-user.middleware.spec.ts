import { TgUserMiddleware } from './tg-user.middleware';

describe('TgUserMiddleware', () => {
  it('should be defined', () => {
    expect(new TgUserMiddleware()).toBeDefined();
  });
});
