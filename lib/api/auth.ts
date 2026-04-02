import { apiClient } from "@/lib/api/client";
import type { LoginResponse, User } from "@/lib/types";

export async function login(payload: { email: string; password: string }) {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}

export async function me() {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}

export async function updateMe(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await apiClient.put<User>("/auth/me", payload);
  return data;
}

export async function changePassword(payload: {
  oldPassword: string;
  newPassword: string;
}) {
  const { data } = await apiClient.put("/auth/change-password", payload);
  return data;
}
