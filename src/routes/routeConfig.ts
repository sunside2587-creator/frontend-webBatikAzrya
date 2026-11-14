import type { UserRole } from '../types';

export const ROUTES = {
  POS: 'pos',
  EXPENSES: 'expenses',
  HPP: 'hpp',
  DASHBOARD: 'dashboard',
  LOGIN: 'login',
} as const;

export type RouteId = (typeof ROUTES)[keyof typeof ROUTES];

export const VALID_ROUTES: readonly RouteId[] = Object.values(ROUTES);

export const PAGE_TITLES: Record<RouteId, string> = {
  [ROUTES.LOGIN]: 'Masuk ke Sistem Azrya Batik',
  [ROUTES.POS]: 'Kasir Cepat (POS) & Penentuan Margin',
  [ROUTES.EXPENSES]: 'Dokumentasi Nota Digital & OCR Bahan',
  [ROUTES.HPP]: 'Kalkulator HPP Batik Dinamis',
  [ROUTES.DASHBOARD]: 'Dashboard Finansial, Stok & AI Advisor',
};

export const ROUTE_ALLOWED_ROLES: Record<RouteId, readonly UserRole[]> = {
  [ROUTES.POS]: ['owner', 'cashier'],
  [ROUTES.EXPENSES]: ['owner', 'cashier'],
  [ROUTES.HPP]: ['owner'],
  [ROUTES.DASHBOARD]: ['owner'],
  [ROUTES.LOGIN]: ['owner', 'cashier', 'guest'],
};
