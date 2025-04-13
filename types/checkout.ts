import { IPaymentMethodType } from "@a2seven/yoo-checkout";

export interface CheckoutItem {
  amount: number;
  description: string;
}

export interface CheckoutPayload {
  months: number;
  name: string;
  locationId: string;
  userId: string;
  username?: string;
  price: number;
  isTrial: boolean;
  promoCode?: string;
  configId?: string;
}

export interface Checkout {
  amount: number;
  idempotence_key: string;
  paymentMethod: IPaymentMethodType;
  items: CheckoutItem[];
  email: string;
  username: string;
  payload: CheckoutPayload
}
