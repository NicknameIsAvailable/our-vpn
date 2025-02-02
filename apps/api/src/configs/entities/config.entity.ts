export class Config {}

export interface ClientConfig {
  id: string;
  alterId?: number;
  email?: string;
  security?: string;
}

export interface VlessLinkOptions {
  uuid: string;
  domain: string;
  port: number;
  path: string;
  name: string;
  security: string;
  type: string;
  host?: string;
}

export interface VlessConfig {
  log: {
    access: string;
    error: string;
    loglevel: string;
  };
  inbounds: Array<{
    port: number;
    protocol: string;
    settings: {
      clients: ClientConfig[];
      decryption: string;
    };
    streamSettings: {
      network: string;
      wsSettings: {
        path: string;
      };
      security: string;
    };
  }>;
  outbounds: Array<{
    protocol: string;
    settings: object;
    tag?: string;
  }>;
  routing?: {
    rules: Array<{
      type: string;
      domain?: string[];
      outboundTag: string;
    }>;
  };
}
