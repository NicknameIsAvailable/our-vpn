import { Context } from "telegraf";
import { LabeledPrice } from "../assets/assets";
import { PromoCode, Location } from "@prisma/client";
import { PaymentMethodLabel } from 'types/payment-method';

interface BotSession {
  locationMessageId?: number;
  subscriptionMessageId?: number;
  paymentMessageId?: number;
  paymentMethod: PaymentMethodLabel;
  currentPrice?: LabeledPrice;
  location?: Location;
  currentInvoiceId?: string;
  waitingForPromoCode?: boolean;
  selectedPromoCode?: PromoCode;
  payment?: {
    invoice_payload: string;
    total_amount: number;
    currency: string;
  };
}

export interface MyContext extends Context {
  session: BotSession;
}
