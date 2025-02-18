import { randomUUID } from "crypto";
import api from "./api";
import { InboundRequest, InboundResponse } from "./types";
import { config } from "./config";

async function login(): Promise<string | null> {
  try {
    const data = {
      username: config.username,
      password: config.password
    };

    const response = await api.post("/login", data);

    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      return setCookie.join("; ");
    }

    return null;
  } catch (error) {
    console.log({ error });
    throw error;
  }
}

function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function addInbound(data: { expiryTime: number; email: string; tgId: string }) {
  try {
    const cookies = await login();
    if (!cookies) {
      throw new Error("Failed to login and get cookies");
    }

    const id = randomUUID();

    const body: InboundRequest = {
      up: 0,
      down: 0,
      total: 0,
      remark: "main",
      enable: true,
      expiryTime: data.expiryTime || 0,
      listen: "",
      port: 443,
      protocol: "vless",
      settings: JSON.stringify({
        clients: [
          {
            comment: `Наш ВПН ${data.email}`,
            email: data.email,
            enable: true,
            expiryTime: data.expiryTime,
            flow: "xtls-rprx-vision",
            id,
            limitIp: 0,
            reset: 0,
            subId: generateRandomString(16),
            tgId: "",
            totalGB: 0
          }
        ],
        decryption: "none",
        fallbacks: [],
      }),
      streamSettings: JSON.stringify({
        "network": "tcp",
        "security": "reality",
        "externalProxy": [],
        "realitySettings": {
          "show": false,
          "xver": 0,
          "dest": "google.com:443",
          "serverNames": [
            "google.com",
            "www.google.com"
          ],
          "privateKey": "oB8rCQMBSuRxDJeWutUIRA6TEr_zC48ulwqLOXDN8Vw",
          "minClient": "",
          "maxClient": "",
          "maxTimediff": 0,
          "shortIds": [
            "eec856f490",
            "875f",
            "caa09348",
            "b2e518cfc1aad1",
            "f4f4021aaa4f",
            "7b",
            "d7267a",
            "dc50c1916ab8ceab"
          ],
          "settings": {
            "publicKey": "d6Jr4DR9B4eQiVsrox9lbZ8FSrnEM8WMkvo9gNuI7GQ",
            "fingerprint": "chrome",
            "serverName": "",
            "spiderX": "/"
          }
        },
        "tcpSettings": {
          "acceptProxyProtocol": false,
          "header": {
            "type": "none"
          }
        }
      }),
      tag: `inbound-${id}`,
      sniffing: JSON.stringify({
        "enabled": false,
        "destOverride": [
          "http",
          "tls",
          "quic",
          "fakedns"
        ],
        "metadataOnly": false,
        "routeOnly": false
      }),
      allocate: JSON.stringify({
        "strategy": "always",
        "refresh": 5,
        "concurrency": 3
      }),
    };

    const response = await api.post<InboundResponse>("/panel/api/inbounds/add", body, {
      headers: {
        "Cookie": cookies
      }
    });

    return response.data;
  } catch (error) {
    console.log({ error });
    return error;
  }
}

async function getInbounds() {
  try {
    const cookies = await login();
    if (!cookies) {
      throw new Error("Failed to login and get cookies");
    }

    const response = await api.get("/panel/api/inbounds/list", {
      headers: {
        "Cookie": cookies
      }
    });

    return response.data;
  } catch (error) {
    console.log({ error });
    return error;
  }
}

export const xuiApi = {
  addInbound,
  getInbounds,
  login,
};
