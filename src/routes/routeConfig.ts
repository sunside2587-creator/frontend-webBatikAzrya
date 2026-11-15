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
  [ROUTES.LOGIN]: 'Masuk',
  [ROUTES.POS]: 'Kasir',
  [ROUTES.EXPENSES]: 'Nota Belanja',
  [ROUTES.HPP]: 'Kalkulator HPP',
  [ROUTES.DASHBOARD]: 'Laporan',
};

export const ROUTE_ALLOWED_ROLES: Record<RouteId, readonly UserRole[]> = {
  [ROUTES.POS]: ['owner', 'cashier'],
  [ROUTES.EXPENSES]: ['owner', 'cashier'],
  [ROUTES.HPP]: ['owner'],
  [ROUTES.DASHBOARD]: ['owner'],
  [ROUTES.LOGIN]: ['owner', 'cashier', 'guest'],
};
