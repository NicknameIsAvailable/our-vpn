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

function generateRandomNumber() {
  return Math.floor(10000 + Math.random() * 90000);
}

async function addClientToInbound(data: { expiryTime: number; email: string; tgId: string }) {
  try {
    const cookies = await login();
    if (!cookies) {
      throw new Error("Failed to login and get cookies");
    }

    // Создаем нового клиента
    const newClient = {
      comment: `Наш ВПН ${data.email}`,
      email: data.email,
      enable: true,
      expiryTime: data.expiryTime,
      flow: "xtls-rprx-vision",
      id: randomUUID(), // Генерация уникального ID для нового клиента
      limitIp: 0,
      reset: 0,
      subId: generateRandomString(16),
      tgId: "", // Используем переданный tgId
      totalGB: 0
    };

    // Отправляем запрос на добавление клиента в существующий инбаунд
    const response = await api.post<InboundResponse>("/panel/api/inbounds/addClient", {
      id: 2,
      settings: JSON.stringify({
        clients: [newClient]
      })
    }, {
      headers: {
        "Cookie": cookies
      }
    });

    console.log("XUI Api: ", response);
    return response.data;
  } catch (error) {
    console.log({ error });
    return error;
  }
}

async function getClients() {
  try {
    const cookies = await login();
    if (!cookies) {
      throw new Error("Failed to login and get cookies");
    }

    const response = await api.get("/panel/api/inbounds/get/2", {
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
