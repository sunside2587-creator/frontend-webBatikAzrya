export type UserRole = 'owner' | 'cashier' | 'guest';

export interface User {
  id: string;
  nama: string;
  email: string;
  role: Exclude<UserRole, 'guest'>;
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  code?: string;
  data: T;
}

export interface ApiError extends Error {
  code: string;
  status: number;
  isNetworkError: boolean;
  isCanceled?: boolean;
  details?: unknown;
}

export type ToastVariant = 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

export type BadgeVariant =
  | 'sage'
  | 'forest'
  | 'soga'
  | 'warning'
  | 'danger'
  | 'neutral';

export type CustomerSegment = 'B2G' | 'B2B' | 'B2C';
export type PaymentMethod = 'transfer' | 'tunai';
export type PaymentStatusKey = 'lunas' | 'DP' | 'belum_bayar';

export interface Product {
  id: string;
  nama: string;
  kategori: string;
  harga_katalog: number;
  hpp_default: number;
  satuan: string;
  ukuran?: string;
  bahan?: string;
  teknik?: string;
  pewarnaan?: string;
  perawatan?: string;
  badge?: string;
  motifPalette?: string[];
}

export interface CartItem {
  product_id: string;
  nama: string;
  satuan: string;
  qty: number;
  harga_satuan: number;
  hpp_snapshot: number;
}

export interface Transaction {
  id: string;
  tanggal: string;
  pelanggan_tipe: CustomerSegment;
  metode_bayar: PaymentMethod;
  status_bayar: string;
  total: number;
  hpp_total: number;
  margin_nominal: number;
  margin_persen: number;
  catatan?: string;
  items: CartItem[];
}

export interface CreateTransactionPayload {
  tanggal: string;
  pelanggan_tipe: CustomerSegment;
  metode_bayar: PaymentMethod;
  status_bayar: PaymentStatusKey;
  total: number;
  items: CartItem[];
}

export interface MarginSummary {
  totalPenjualan: number;
  totalHpp: number;
  labaKotor: number;
  marginPersen: number;
  totalUnit: number;
  isHealthy: boolean;
  isLoss: boolean;
}

export interface Material {
  id: string;
  nama: string;
  satuan: string;
  stok_saat_ini: number;
  stok_minimum: number;
  harga_per_satuan: number;
}

export type ExpenseCategoryKey = 'bahan' | 'alat' | 'operasional';
export type ExpenseSource = 'ocr' | 'manual';

export interface ExpenseDraftItem {
  nama_item: string;
  material_id: string;
  qty: number | string;
  satuan: string;
  harga_per_satuan: number | string;
  needs_correction?: boolean;
  subtotal?: number;
}

export interface ExpenseDraft {
  toko: string;
  tanggal: string;
  kategori: string;
  sumber: ExpenseSource;
  confidence: number;
  needs_verification: boolean;
  bukti_url: string;
  items: ExpenseDraftItem[];
}

export interface Expense {
  id: string;
  tanggal: string;
  toko: string;
  kategori: string;
  total: number;
  sumber: ExpenseSource;
  confidence: number;
  needs_verification: boolean;
  bukti_url: string;
  items: ExpenseDraftItem[];
}

export interface HppMaterialItem {
  material_id: string;
  nama: string;
  satuan: string;
  pemakaian: number | string;
  harga_satuan: number | string;
  susut: number;
}

export interface HppLaborCost {
  meter_canting: number | string;
  upah_canting_per_meter: number | string;
  upah_warna: number | string;
  upah_lorod: number | string;
}

export interface HppOverheadCost {
  np: number | string;
  ns: number | string;
  up: number | string;
  alokasi: number;
  energi: number | string;
  kemasan: number | string;
}

export interface HppRecipe {
  id: string;
  product_id: string;
  nama_resep: string;
  bahan: HppMaterialItem[];
  tenaga_kerja: HppLaborCost;
  overhead: HppOverheadCost;
  yield: number;
  margin_target: number;
  harga_kustom: number | string;
}

export interface HppBreakdownResult {
  bb: number;
  tkl: number;
  penyusutan: number;
  bop: number;
  totalProduksi: number;
  hpp_unit: number;
  harga_saran: number;
  margin_nominal_saran: number;
  margin_persen_target: number;
  is_below_hpp: boolean;
  selisih_kustom: number;
  margin_persen_kustom: number;
  komposisi: {
    bb: number;
    tkl: number;
    bop: number;
  };
}

export interface DashboardSummaryMetrics {
  omzet: number;
  hpp: number;
  laba_kotor: number;
  laba_bersih: number;
  margin_kotor_persen: number;
  arus_kas_status: string;
  pertumbuhan_omzet: string;
}

export interface TrendPoint {
  periode: string;
  pendapatan: number;
  hpp: number;
  pengeluaran_op: number;
}

export interface BestSellingProduct {
  nama: string;
  kategori: string;
  terjual: number;
  omzet: number;
  segmen: string;
}

export interface DashboardData {
  data_label: string;
  summary: DashboardSummaryMetrics;
  trend: TrendPoint[];
  produk_terlaris: BestSellingProduct[];
}

export interface StockForecast {
  id: string;
  target: string;
  nama_bahan: string;
  pemakaian_resep: string;
  periode: string;
  nilai_prediksi: number;
  rekomendasi_stok: number;
  satuan: string;
  stok_saat_ini: number;
  stok_minimum: number;
  status_stok: string;
  asumsi: string;
  data_label: string;
  model_version: string;
}

export interface WeeklyInsight {
  id: string;
  periode: string;
  segmen_highlight: string;
  status: 'ai' | 'fallback_template';
  prompt_version: string;
  isi_json: {
    ringkasan: string;
    sorotan: string[];
    risiko: string[];
    rekomendasi: string[];
  };
}

export interface RagChatMessage {
  sender: 'user' | 'assistant';
  intent?: string;
  text: string;
  sources?: string[];
}

export interface ScrollspyGroupConfig<K extends string = string> {
  key: K;
  label: string;
  badgeVariant: BadgeVariant;
}

export interface ScrollspyGroupItem<K extends string = string>
  extends ScrollspyGroupConfig<K> {
  startIdx: number;
  count: number;
}
