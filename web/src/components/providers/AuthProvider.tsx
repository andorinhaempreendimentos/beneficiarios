'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthProfile } from '@/lib/api/auth';
import { apiLogout, fetchProfile } from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/client';

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

function toAuthUser(p: AuthProfile): AuthUser {
  return { ...p, refId: p.entidadeId ?? p.id };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      fetchProfile(session.user.id)
        .then((profile) => setUser(toAuthUser(profile)))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        fetchProfile(session.user.id)
          .then((profile) => setUser(toAuthUser(profile)))
          .catch(() => setUser(null));
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  function login(profile: AuthProfile) {
    setUser(toAuthUser(profile));
  }

  async function logout() {
    try { await apiLogout(); } catch { /* ignora erro de rede */ }
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
