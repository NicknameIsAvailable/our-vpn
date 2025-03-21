import { IPaymentMethodType } from "@a2seven/yoo-checkout";

export interface PaymentMethodLabel {
  label: string;
  value: IPaymentMethodType;
}
