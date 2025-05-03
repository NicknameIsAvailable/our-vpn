import axios from "axios";
import { config } from "./config";
import * as https from "https";
import { Location } from "@prisma/client";

export function generateApi(location: Location) {
  console.log("generateApi")

  const api = axios.create({
    baseURL: location.url,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
    httpsAgent: new https.Agent({ rejectUnauthorized: config.isProd })
  })

  console.log("generateApi", 2)

  api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error),
  );

  console.log("generateApi", 3)

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('XUI API Error:', error.response);
      return Promise.reject(error.response);
    },
  )

  console.log("generateApi", 4)

  return api
}
