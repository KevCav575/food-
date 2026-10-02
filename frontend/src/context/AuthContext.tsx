import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../services/api.ts';
import type { UserProfile } from '../types/api.ts';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Vuelve a pedir el perfil (ej. tras un escaneo, para actualizar el contador) */
  refreshUser: () => Promise<void>;
  /** Aplica cambios ya confirmados por el servidor sin volver a pedir el perfil */
  mergeUser: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type UserResponse = { user: UserProfile };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setUser((await api<UserResponse>('/auth/me')).user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await api<UserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const { user } = await api<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: name || undefined }),
    });
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  }, []);

  const mergeUser = useCallback((patch: Partial<UserProfile>) => {
    setUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, mergeUser }),
    [user, loading, login, register, logout, refreshUser, mergeUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
