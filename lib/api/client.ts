import axios from "axios";
import { storage } from "@/lib/storage";

const API_BASE_URL = "https://api.duitlog.adheetya.my.id/api";
// const API_BASE_URL = "http://localhost:3002/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
