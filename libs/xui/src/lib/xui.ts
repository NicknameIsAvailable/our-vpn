import { randomUUID } from "crypto";
import { InboundResponse } from "./types";
import { Location } from "@prisma/client";
import { generateApi } from "./api";

async function login(location: Location): Promise<string | null> {
  try {
    const data = {
      username: location.user,
      password: location.password
    };

    const api = generateApi(location)

    const response = await api.post("/login", data);

    const setCookie = response.headers["set-cookie"];
    if (setCookie) {
      return setCookie.join("; ");
    }

    return null;
  } catch (error) {
    console.log({ loginError: error });
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

async function addClientToInbound(location: Location, data: { expiryTime: number; email: string; tgId: string, username: string }) {
  try {
    console.log({ location })
    const api = generateApi(location)

    const cookies = await login(location);
    if (!cookies) {
      throw new Error("Failed to login and get cookies");
    }
    const newClient = {
      comment: `${location.host} ${data.tgId}`,
      email: data.email,
      enable: true,
      expiryTime: data.expiryTime,
      flow: "xtls-rprx-vision",
      id: randomUUID(),
      limitIp: 0,
      reset: 0,
      subId: generateRandomString(16),
      tgId: "",
      totalGB: 0
    };

    const response = await api.post<InboundResponse>("/panel/api/inbounds/addClient", {
      id: 1,
      settings: JSON.stringify({
        clients: [newClient]
      })
    }, {
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

async function getClients(location: Location) {
  try {
    const api = generateApi(location)

    const cookies = await login(location);
    if (!cookies) {
      throw new Error("Failed to login and get cookies");
    }

    const response = await api.get("/panel/api/inbounds/get/1", {
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
  addClientToInbound,
  getClients,
  login,
};
