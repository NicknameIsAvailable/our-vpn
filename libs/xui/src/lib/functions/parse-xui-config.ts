import { JsonValue } from "@prisma/client/runtime/library";
import { XUIConfig } from "../types";

export function parseXUIConfig(configtToParse: JsonValue): XUIConfig {
  const config = JSON.parse(String(configtToParse)).obj;
  const streamSettings: XUIConfig["streamSettings"] = JSON.parse(config.streamSettings);
  const sniffing: XUIConfig["sniffing"] = JSON.parse(config.sniffing);
  const allocate: XUIConfig["allocate"] = JSON.parse(config.allocate);
  const settings: XUIConfig["settings"] = JSON.parse(config.settings);

  const parsedConfig: XUIConfig = {
    ...config,
    streamSettings,
    sniffing,
    allocate,
    settings,
  };

  return parsedConfig;
}