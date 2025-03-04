import axios from "axios";
import { config } from "./config";
import * as https from "https";

const api = axios.create({
  baseURL: config.url,
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

export default api;
