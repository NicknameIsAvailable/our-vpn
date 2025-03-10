export class CreateConfigDto {
  months: number;
  name: string;
  locationId: string;
  userId: string;
  username?: string;
  price: number;
  isTrial: boolean;
  promoCode?: string;
}
