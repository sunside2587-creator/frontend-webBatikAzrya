import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEYS } from '../constants';
import { isRequestCanceled, setUnauthorizedHandler } from '../services/apiClient';
import { fetchCurrentUser, loginRequest } from '../services/authService';
import type { ApiResponse, User, UserRole } from '../types';
import { useToast } from './useToast';

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<ApiResponse<{ token: string; user: User }>>;
  logout: (reasonMessage?: string) => void;
  switchDemoRole: (role: 'owner' | 'cashier') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_OWNER: User = {
  id: 'USR-01',
  nama: 'Ibu Azrya (Pemilik UMKM)',
  email: 'owner@azryabatik.id',
  role: 'owner',
};

const DEFAULT_CASHIER: User = {
  id: 'USR-02',
  nama: 'Sandi (Admin / Kasir Galeri)',
  email: 'kasir@azryabatik.id',
  role: 'cashier',
};

interface AuthProviderProps {
  children: ReactNode;
  onRequireLoginRedirect?: () => void;
}

export function AuthProvider({
  children,
  onRequireLoginRedirect,
}: AuthProviderProps) {
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? (JSON.parse(stored) as User) : DEFAULT_OWNER;
    } catch {
      return DEFAULT_OWNER;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  const logout = useCallback(
    (reasonMessage?: string) => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      setIsAuthenticated(false);
      if (reasonMessage) {
        showToast(reasonMessage, 'warning', 5500);
      }
      if (onRequireLoginRedirect) {
        onRequireLoginRedirect();
      }
    },
    [onRequireLoginRedirect, showToast]
  );

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      logout(message);
    });
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;

    const controller = new AbortController();
    fetchCurrentUser(controller.signal)
      .then((res) => {
        if (!controller.signal.aborted && res?.data) {
          setUser(res.data);
          setIsAuthenticated(true);
        }
      })
      .catch((error) => {
        if (isRequestCanceled(error)) return;
        // Tetap gunakan sesi lokal jika mode offline/demo aktif
      });

    return () => {
      controller.abort();
    };
  }, []);

  const login = useCallback(
    async ({ email, password }: { email: string; password: string }) => {
      setIsAuthLoading(true);
      try {
        const result = await loginRequest({ email, password });
        const { token, user: loggedInUser } = result.data;
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        setIsAuthenticated(true);
        return result;
      } finally {
        setIsAuthLoading(false);
      }
    },
    []
  );

  const switchDemoRole = useCallback(
    (targetRole: 'owner' | 'cashier') => {
      const nextUser = targetRole === 'cashier' ? DEFAULT_CASHIER : DEFAULT_OWNER;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, `demo-jwt-${nextUser.role}`);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));
      setUser(nextUser);
      setIsAuthenticated(true);
      showToast(
        `Berpindah ke peran ${nextUser.role === 'owner' ? 'Pemilik UMKM' : 'Admin / Kasir'}.`,
        'success',
        3000
      );
    },
    [showToast]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role || 'guest',
      isAuthenticated,
      isAuthLoading,
      login,
      logout,
      switchDemoRole,
    }),
    [user, isAuthenticated, isAuthLoading, login, logout, switchDemoRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
