"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as authApi from "@/lib/api/auth";
import { storage } from "@/lib/storage";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    storage.clearToken();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.me();
    setUser(profile);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = storage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshProfile();
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [logout, refreshProfile]);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const { token, user: nextUser } = await authApi.login(payload);
    storage.setToken(token);
    setUser(nextUser);
  }, []);

  const register = useCallback(
    async (payload: { name: string; email: string; password: string }) => {
      await authApi.register(payload);
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [isLoading, login, logout, refreshProfile, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
