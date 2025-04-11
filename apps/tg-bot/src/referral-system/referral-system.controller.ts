import { Controller } from '@nestjs/common';
import { ReferralSystemService } from './referral-system.service';

@Controller()
export class ReferralSystemController {
  constructor(private readonly referralSystemService: ReferralSystemService) {}
}
