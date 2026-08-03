"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { AuthUser } from "@/lib/auth";
import { carregarSessao, limparSessao, salvarSessao } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(carregarSessao());
    setLoading(false);
  }, []);

  function login(u: AuthUser) {
    salvarSessao(u);
    setUser(u);
  }

  function logout() {
    limparSessao();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
