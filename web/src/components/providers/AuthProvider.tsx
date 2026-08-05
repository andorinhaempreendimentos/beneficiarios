'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthProfile } from '@/lib/api/auth';
import { apiMe, apiLogout } from '@/lib/api/auth';

// AuthUser compatível com o resto do app
export type AuthUser = AuthProfile & { refId: string };

interface AuthContextValue {
  user: AuthUser | null;
  login: (profile: AuthProfile) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: async () => {},
  loading: true,
});

const SESSION_KEY = 'andorinha_session';

function toAuthUser(p: AuthProfile): AuthUser {
  return { ...p, refId: p.entidadeId ?? p.id };
}

function saveSession(u: AuthUser) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch { /* noop */ }
}

function loadSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tentar restaurar sessão da memória de sessão primeiro (evita flash)
    const cached = loadSession();
    if (cached) {
      setUser(cached);
      setLoading(false);
      return;
    }
    // Se não tiver em sessão, validar com a API
    apiMe()
      .then((profile) => {
        const u = toAuthUser(profile);
        saveSession(u);
        setUser(u);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function login(profile: AuthProfile) {
    const u = toAuthUser(profile);
    saveSession(u);
    setUser(u);
  }

  async function logout() {
    try { await apiLogout(); } catch { /* ignora erro de rede */ }
    clearSession();
    setUser(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
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
