export const config = {
  shopId: process.env.YOO_CHECKOUT_SHOP_ID || "",
  secretKey: process.env.YOO_CHECKOUT_SECRET_KEY || "",
  clientId: process.env.YOO_CHECKOUT_OAUTH_CLIENT_ID || "",
  clientSecret: process.env.YOO_CHECKOUT_OAUTH_CLIENT_SECRET || "",
  token: process.env.YOO_CHECKOUT_OAUTH_TOKEN || "",
}
