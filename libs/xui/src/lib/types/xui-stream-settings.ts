export interface XUIStreamSettings {
  network: string;
  security: string;
  realitySettings: {
    show: string;
    xver: number;
    dest: string;
    serverNames: string[];
    privateKey: string;
    minCLient: string;
    maxClient: string;
    maxtimediff: number;
    shortIds: string[];
    settings: {
      publicKey: string;
      fingerprint: string;
      serverName: string;
      spideX: string;
    }
  };
  tcpSettings: {
    acceptProxyProtocol: boolean;
    header: {
      type: string;
    }
  }
}