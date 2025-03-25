import { YooCheckout } from '@a2seven/yoo-checkout';
import { config } from "./config"

export const checkout = new YooCheckout({
  shopId: config.shopId,
  secretKey: config.secretKey,
  token: config.token
})
