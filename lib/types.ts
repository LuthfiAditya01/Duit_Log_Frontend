export type ThemeMode = "light" | "dark" | "system";
export type Locale = "id" | "en";

export interface User {
  _id: string;
  name: string;
  email: string;
  balance: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Category {
  _id: string;
  name: string;
  type: "expense" | "income";
  color: string | null;
  isVisible: boolean;
}

export interface Wallet {
  _id: string;
  name: string;
  type: "bank" | "e-wallet" | "cash" | "other";
  balance: number;
  color: string | null;
  isActive: boolean;
}

export interface TransactionListItem {
  _id: string;
  amount: number;
  type: "income" | "expense";
  category: Pick<Category, "_id" | "name" | "color">;
  wallet: Pick<Wallet, "_id" | "name">;
  description: string | null;
  date: string;
}

export interface Bill {
  _id: string;
  name: string;
  amount: number;
  dueDay: number;
  frequency: "MONTHLY" | "YEARLY";
  dueMonth?: number;
}

