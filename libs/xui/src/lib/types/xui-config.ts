import { XUIClient } from "./xui-client";
import { XUIStreamSettings } from "./xui-stream-settings";

export interface XUIConfig {
  id: number;
  up: number;
  down: number;
  total: number;
  remark: string;
  enable: boolean;
  expiryTime: number;
  clientStats: XUIClient[];
  listen: string;
  port: number;
  protocol: string;
  streamSettings: XUIStreamSettings;
  tag: string;
  settings: {
    clients: XUIClient[];
    decryption: string;
    fallbacks: string[];
  },
  sniffing: {
    enabled: boolean;
    destOverride: string[];
    routeOnly: boolean;
    metadataOnly: boolean;
  },
  allocate: {
    strategy: string;
    refresh: number;
    concurrency: number;
  },
}