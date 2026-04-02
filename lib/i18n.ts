import type { Locale } from "@/lib/types";

type Dictionary = Record<string, string>;

const id: Dictionary = {
  appName: "Duit Log",
  login: "Masuk",
  register: "Daftar",
  email: "Email",
  password: "Kata sandi",
  fullName: "Nama lengkap",
  confirmPassword: "Konfirmasi kata sandi",
  noAccount: "Belum punya akun?",
  alreadyHaveAccount: "Sudah punya akun?",
  signInNow: "Masuk sekarang",
  signUpNow: "Daftar sekarang",
  dashboard: "Dashboard",
  logout: "Keluar",
  loading: "Memuat...",
  authFailed: "Autentikasi gagal",
  welcome: "Selamat datang",
};

const en: Dictionary = {
  appName: "Duit Log",
  login: "Login",
  register: "Register",
  email: "Email",
  password: "Password",
  fullName: "Full name",
  confirmPassword: "Confirm password",
  noAccount: "No account yet?",
  alreadyHaveAccount: "Already have an account?",
  signInNow: "Sign in now",
  signUpNow: "Sign up now",
  dashboard: "Dashboard",
  logout: "Logout",
  loading: "Loading...",
  authFailed: "Authentication failed",
  welcome: "Welcome",
};

export const dictionaries: Record<Locale, Dictionary> = { id, en };
