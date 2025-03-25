import { resolve } from "path";

export const config = {
  isProd: process.env["PRODUCTION"] === "true",
  url: process.env["XUI_URL"] || "",
  host: process.env["XUI_HOST"] || "",
  port: process.env["XUI_PORT"] || "",
  username: process.env["XUI_USERNAME"] || "",
  password: process.env["XUI_PASSWORD"] || "",
  certUrl: resolve(__dirname, process.env["XUI_CERT_URL"] || ""),
}
