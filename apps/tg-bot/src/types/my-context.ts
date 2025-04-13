import { Context } from "telegraf";
import { LabeledPrice } from "../assets/assets";
import { PromoCode, Location } from "@prisma/client";
import { PaymentMethodLabel } from 'types/payment-method';
import { ExtendedConfig } from 'types/extended-config';

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
  configToExtend?: ExtendedConfig;
  waitingForDaysInput?: boolean;
  selectedDays?: number;
  selectedMonths?: number;
  isNewConfig?: boolean;
  isExtending?: boolean;
  payment?: {
    invoice_payload: string;
    total_amount: number;
    currency: string;
  };
}

export interface MyContext extends Context {
  session: BotSession;
}
