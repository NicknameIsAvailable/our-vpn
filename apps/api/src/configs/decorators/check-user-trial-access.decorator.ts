import { SetMetadata } from '@nestjs/common';

export const CheckUserTrialAccess = (userId: string) => {
  console.log('CheckUserTrialAccess applied with userId:', userId);
  return SetMetadata('check-user-trial-access', userId);
}
