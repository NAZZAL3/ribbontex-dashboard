import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearToken, hasToken, setToken } from '../api/client';

interface AuthContextType {
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasToken()) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((u) => setUsername(u.username))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (user: string, pass: string) => {
    const res = await api.login(user, pass);
    setToken(res.token);
    setUsername(res.username);
  };

  const logout = () => {
    clearToken();
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
