import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, ApiError, unwrap, type User } from "../api/client";

type RegisterInput = { name: string; email: string; password: string; consent_pd: boolean };

type AuthState = {
  /** undefined — ещё проверяем сессию, null — гость. */
  user: User | null | undefined;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  /** Сбросить пользователя, если API ответил 401 (сессия истекла). */
  forget: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    unwrap(api.GET("/me"))
      .then(setUser)
      .catch((e: unknown) => {
        if (!(e instanceof ApiError) || e.status !== 401) console.warn("не удалось проверить сессию");
        setUser(null);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await unwrap(api.POST("/auth/login", { body: { email, password } }));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const u = await unwrap(api.POST("/auth/register", { body: { ...input, consent_marketing: false } }));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await unwrap(api.POST("/auth/logout"));
    setUser(null);
  }, []);

  const forget = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, register, logout, forget }), [user, login, register, logout, forget]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth вне AuthProvider");
  return ctx;
}
