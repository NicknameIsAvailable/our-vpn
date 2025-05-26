import axios from "axios";
import { config } from "./config";
import * as https from "https";
import { Location } from "@prisma/client";

export function generateApi(location: Location) {

  const api = axios.create({
    baseURL: location.url,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true,
    httpsAgent: new https.Agent({ rejectUnauthorized: config.isProd })
  })


  api.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error),
  );


  api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('XUI API Error:', error.response);
      return Promise.reject(error.response);
    },
  )


  return api
}
