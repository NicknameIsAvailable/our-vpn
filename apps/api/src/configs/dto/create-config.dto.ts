import { CreateConfig } from "types/create-config"

export class CreateConfigDto implements CreateConfig {
  tgUserId: string;
  username: string;
  months: number;
  isTrial: boolean;
  promoCode: string;
  name: string;
  locationId: string;
  price: number;
}
