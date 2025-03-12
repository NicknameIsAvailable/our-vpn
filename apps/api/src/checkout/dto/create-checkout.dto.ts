import { Checkout } from "types/checkout"

export class CheckoutItemDTO {
  amount: number;
  description: string;
}

export class CheckoutPayloadDTO {
  months: number;
  name: string;
  locationId: string;
  userId: string;
  username?: string;
  price: number;
  isTrial: boolean;
  promoCode?: string;
}

export class CreateCheckoutDTO implements Checkout {
    amount: number;
    idempotence_key: string;
    items: CheckoutItemDTO[];
    email: string;
    username: string;
    payload: CheckoutPayloadDTO
}