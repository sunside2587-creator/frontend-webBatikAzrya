import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { setUnauthorizedHandler } from '../api/apiClient';
import { fetchCurrentUser, loginRequest } from '../api/services/authService';
import { useToast } from './useToast';

const AuthContext = createContext(null);

const DEFAULT_OWNER = {
  id: 'USR-01',
  nama: 'Ibu Azrya (Pemilik UMKM)',
  email: 'owner@azryabatik.id',
  role: 'owner',
};

const DEFAULT_CASHIER = {
  id: 'USR-02',
  nama: 'Sandi (Admin / Kasir Galeri)',
  email: 'kasir@azryabatik.id',
  role: 'cashier',
};

export function AuthProvider({ children, onRequireLoginRedirect }) {
  const { showToast } = useToast();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('azrya_user');
      return stored ? JSON.parse(stored) : DEFAULT_OWNER;
    } catch {
      return DEFAULT_OWNER;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('access_token') || true);
  });
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const logout = useCallback(
    (reasonMessage) => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('azrya_user');
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
    const token = localStorage.getItem('access_token');
    if (!token) return;
    fetchCurrentUser()
      .then((res) => {
        if (res?.data) {
          setUser(res.data);
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        // Ditangani oleh interceptor atau fallback lokal
      });
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setIsAuthLoading(true);
    try {
      const result = await loginRequest({ email, password });
      const { token, user: loggedInUser } = result.data;
      localStorage.setItem('access_token', token);
      localStorage.setItem('azrya_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return result;
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const switchDemoRole = useCallback(
    (role) => {
      const nextUser = role === 'cashier' ? DEFAULT_CASHIER : DEFAULT_OWNER;
      localStorage.setItem('access_token', `demo-jwt-${nextUser.role}`);
      localStorage.setItem('azrya_user', JSON.stringify(nextUser));
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

  const value = useMemo(
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return ctx;
}
