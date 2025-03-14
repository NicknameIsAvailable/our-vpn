export class SendConfigDto {
  months: number;
  name: string;
  locationId: string;
  userId: string;
  username?: string;
  price: number;
  isTrial: boolean;
  promoCode?: string;
}

export class PaymentInfo {
  id: string;
  status: string;
  captured_at: string;
  created_at: string;
  paid: boolean;
  refundable: boolean;
  receipt_registration: string;
}
