import { SetMetadata } from '@nestjs/common';

export const CheckUserTrialAccess = (userId: string) => {
  return SetMetadata('check-user-trial-access', userId);
}
