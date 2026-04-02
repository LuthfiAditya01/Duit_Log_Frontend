import { apiClient } from "@/lib/api/client";
import type {
  Category,
  Bill,
  TransactionListItem,
  Wallet,
} from "@/lib/types";

export async function fetchTransactions(month: number, year: number) {
  const { data } = await apiClient.get("/transactions", {
    params: { month, year },
  });

  // Handle both API shapes: [] and { transactions: [] } / { data: [] }
  if (Array.isArray(data)) {
    return data as TransactionListItem[];
  }

  if (Array.isArray((data as { transactions?: unknown })?.transactions)) {
    return (data as { transactions: TransactionListItem[] }).transactions;
  }

  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: TransactionListItem[] }).data;
  }

  return [];
}

export async function createTransaction(payload: {
  amount: number;
  type: "income" | "expense";
  category: string;
  wallet: string;
  description?: string;
  date: string;
}) {
  const { data } = await apiClient.post("/transactions", payload);
  return data;
}

export async function deleteTransaction(id: string) {
  const { data } = await apiClient.delete(`/transactions/${id}`);
  return data;
}

export async function fetchCategories() {
  const { data } = await apiClient.get("/categories");

  // Handle both API shapes: [] and { categories: [] } / { data: [] }
  if (Array.isArray(data)) {
    return data as Category[];
  }

  if (Array.isArray((data as { categories?: unknown })?.categories)) {
    return (data as { categories: Category[] }).categories;
  }

  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: Category[] }).data;
  }

  return [];
}

export async function createCategory(payload: {
  name: string;
  type: "expense" | "income";
  color?: string | null;
  isVisible: boolean;
}) {
  const { data } = await apiClient.post("/categories", payload);
  return data;
}

export async function updateCategory(
  id: string,
  payload: {
    name: string;
    type: "expense" | "income";
    color?: string | null;
    isVisible: boolean;
  }
) {
  const { data } = await apiClient.put(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string) {
  const { data } = await apiClient.delete(`/categories/${id}`);
  return data;
}

export async function fetchWallets() {
  const { data } = await apiClient.get("/wallet");

  // Handle both API shapes: [] and { wallets: [] } / { data: [] }
  if (Array.isArray(data)) {
    return data as Wallet[];
  }

  if (Array.isArray((data as { wallets?: unknown })?.wallets)) {
    return (data as { wallets: Wallet[] }).wallets;
  }

  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: Wallet[] }).data;
  }

  return [];
}

export async function createWallet(payload: {
  name: string;
  type: "bank" | "e-wallet" | "cash" | "other";
  balance: number;
  color?: string | null;
  isActive: boolean;
}) {
  const { data } = await apiClient.post("/wallet", payload);
  return data;
}

export async function updateWallet(
  id: string,
  payload: {
    name: string;
    type: "bank" | "e-wallet" | "cash" | "other";
    balance: number;
    color?: string | null;
    isActive: boolean;
  }
) {
  const { data } = await apiClient.put(`/wallet/${id}`, payload);
  return data;
}

export async function deleteWallet(id: string) {
  const { data } = await apiClient.delete(`/wallet/${id}`);
  return data;
}

export async function fetchBills() {
  const { data } = await apiClient.get("/bills");

  // Handle both API shapes: [] and { bills: [] } / { data: [] }
  if (Array.isArray(data)) {
    return data as Bill[];
  }

  if (Array.isArray((data as { bills?: unknown })?.bills)) {
    return (data as { bills: Bill[] }).bills;
  }

  if (Array.isArray((data as { data?: unknown })?.data)) {
    return (data as { data: Bill[] }).data;
  }

  return [];
}

export async function createBill(payload: {
  name: string;
  amount: number;
  dueDay: number;
  frequency: "MONTHLY" | "YEARLY";
  dueMonth?: number;
}) {
  const { data } = await apiClient.post("/bills", payload);
  return data;
}

export async function updateBill(
  id: string,
  payload: {
    name: string;
    amount: number;
    dueDay: number;
    frequency: "MONTHLY" | "YEARLY";
    dueMonth?: number;
  }
) {
  const { data } = await apiClient.put(`/bills/${id}`, payload);
  return data;
}

export async function deleteBill(id: string) {
  const { data } = await apiClient.delete(`/bills/${id}`);
  return data;
}
