import type {
  CustomerSegment,
  ExpenseCategoryKey,
  PaymentStatusKey,
  ScrollspyGroupConfig,
} from '../types';

/** Tombol uji (sandi salah, fallback AI) hanya tampil saat `npm run dev`. */
export const IS_DEV_TOOLS_VISIBLE = import.meta.env.DEV;

/** Pengalih peran demo tampil saat dev atau jika VITE_DEMO_MODE=true. */
export const IS_DEMO_MODE =
  import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true';

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  PRODUCTS: '/products',
  TRANSACTIONS: '/transactions',
  MATERIALS: '/materials',
  EXPENSES: '/expenses',
  EXPENSES_SCAN: '/expenses/scan',
  HPP_RECIPES: '/hpp/recipes',
  HPP_CALCULATE: '/hpp/calculate',
  DASHBOARD_SUMMARY: '/dashboard/summary',
  DASHBOARD_TREND: '/dashboard/trend',
  FORECAST_DEMAND: '/forecast/demand',
  FORECAST_STOCK: '/forecast/stock',
  INSIGHTS_WEEKLY: '/insights/weekly',
  CHAT_RAG: '/chat',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER: 'azrya_user',
  TRANSACTIONS: 'azrya_demo_transactions',
  EXPENSES: 'azrya_demo_expenses',
  MATERIALS: 'azrya_demo_materials',
  RECIPES: 'azrya_demo_recipes',
  LAST_ROUTE: 'azrya_last_route',
} as const;

export const BUSINESS_CONSTANTS = {
  API_TIMEOUT_MS: 12000,
  OCR_TIMEOUT_MS: 15000,
  HEALTH_TIMEOUT_MS: 4000,
  HEALTHY_MARGIN_PCT: 20,
  SCROLLSPY_THRESHOLD: 10,
  SCROLLSPY_LOCK_MS: 700,
  MAX_OCR_IMAGE_BYTES: 5 * 1024 * 1024,
  RAG_TEXTAREA_MIN_HEIGHT: 44,
  RAG_TEXTAREA_MAX_HEIGHT: 180,
  DEFAULT_TOAST_DURATION_MS: 4500,
  DEMO_PASSWORD: 'azrya2026',
  PRD01_HPP_SNAPSHOT: 235000,
  DEFAULT_MARGIN_TARGET_PCT: 35,
  MAX_MARGIN_RATIO: 0.95,
} as const;

export const SEGMENT_OPTIONS: ReadonlyArray<{
  id: CustomerSegment;
  title: string;
  desc: string;
}> = [
  { id: 'B2G', title: 'B2G', desc: 'Dinas / Instansi / ASN' },
  { id: 'B2B', title: 'B2B', desc: 'Sekolah / Perusahaan' },
  { id: 'B2C', title: 'B2C', desc: 'Kolektor / Galeri' },
];

export const PAYMENT_STATUS_ORDER: Record<PaymentStatusKey, number> = {
  lunas: 0,
  DP: 1,
  belum_bayar: 2,
};

export const PAYMENT_STATUS_GROUPS: ReadonlyArray<ScrollspyGroupConfig<PaymentStatusKey>> = [
  { key: 'lunas', label: 'Lunas', badgeVariant: 'sage' },
  { key: 'DP', label: 'DP', badgeVariant: 'warning' },
  { key: 'belum_bayar', label: 'Belum Bayar', badgeVariant: 'danger' },
];

export const EXPENSE_CATEGORY_ORDER: Record<ExpenseCategoryKey, number> = {
  bahan: 0,
  alat: 1,
  operasional: 2,
};

export const EXPENSE_CATEGORY_GROUPS: ReadonlyArray<ScrollspyGroupConfig<ExpenseCategoryKey>> = [
  { key: 'bahan', label: 'Bahan Baku', badgeVariant: 'soga' },
  { key: 'alat', label: 'Alat Produksi', badgeVariant: 'forest' },
  { key: 'operasional', label: 'Operasional', badgeVariant: 'neutral' },
];

export const SAMPLE_RAG_QUESTIONS: readonly string[] = [
  'Berapa sisa lilin malam dan apakah cukup untuk pesanan 20 kain seragam B2G besok?',
  'Berapa HPP pokok batik tulis motif daun mangga saat ini?',
  'Bagaimana ringkasan laba bersih bulan Mei 2026?',
];
