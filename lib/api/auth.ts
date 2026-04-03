import { apiClient } from "@/lib/api/client";
import type { LoginResponse, User } from "@/lib/types";

type ApiEnvelope<T> = {
  data: T;
};

function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

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
  const { data } = await apiClient.get<User | ApiEnvelope<User>>("/auth/me");
  return unwrapApiData(data);
}

export async function updateMe(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await apiClient.put<User | ApiEnvelope<User>>("/auth/me", payload);
  return unwrapApiData(data);
}

export async function changePassword(payload: {
  oldPassword: string;
  newPassword: string;
}) {
  const { data } = await apiClient.put("/auth/change-password", payload);
  return data;
}
