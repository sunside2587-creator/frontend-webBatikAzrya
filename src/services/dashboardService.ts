import { API_ENDPOINTS, BUSINESS_CONSTANTS } from '../constants';
import type {
  ApiError,
  ApiResponse,
  DashboardData,
  DashboardSummaryMetrics,
  StockForecast,
  TrendPoint,
  WeeklyInsight,
} from '../types';
import apiClient, { isApiError } from './apiClient';
import { dummyDashboardData } from './mockData';

export interface DashboardFilters {
  periode?: string;
  kategori?: string;
  segmen?: string;
}

interface SummaryApiResponse {
  data?: DashboardSummaryMetrics & { data_label?: string };
}

interface TrendApiResponse {
  data?: {
    trend?: TrendPoint[];
    produk_terlaris?: DashboardData['produk_terlaris'];
  };
}

export async function checkApiHealth(signal?: AbortSignal): Promise<{
  online: boolean;
  mode?: string;
  data?: unknown;
}> {
  try {
    const response = await apiClient.get(API_ENDPOINTS.HEALTH, {
      timeout: BUSINESS_CONSTANTS.HEALTH_TIMEOUT_MS,
      signal,
    });
    return { online: true, data: response.data };
  } catch {
    return { online: false, mode: 'demo-local' };
  }
}

export async function getDashboardSummary(
  filters: DashboardFilters = {},
  signal?: AbortSignal
): Promise<ApiResponse<DashboardData>> {
  try {
    const [summaryRes, trendRes] = await Promise.all([
      apiClient.get<SummaryApiResponse>(API_ENDPOINTS.DASHBOARD_SUMMARY, {
        params: filters,
        signal,
      }),
      apiClient.get<TrendApiResponse>(API_ENDPOINTS.DASHBOARD_TREND, {
        params: filters,
        signal,
      }),
    ]);
    return {
      status: 'success',
      data: {
        summary: summaryRes.data?.data || dummyDashboardData.summary,
        trend: trendRes.data?.data?.trend || dummyDashboardData.trend,
        produk_terlaris:
          trendRes.data?.data?.produk_terlaris || dummyDashboardData.produk_terlaris,
        data_label: summaryRes.data?.data?.data_label || 'ASLI',
      },
    };
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      await new Promise((r) => setTimeout(r, 350));
      const { segmen = 'ALL', kategori = 'ALL', periode = 'Mei 2026' } = filters;

      const segmentFactor =
        segmen === 'B2G' ? 0.62 : segmen === 'B2B' ? 0.24 : segmen === 'B2C' ? 0.14 : 1;
      const periodFactor = periode === 'April 2026' ? 0.88 : periode === 'Q2 2026' ? 2.45 : 1;
      const factor = segmentFactor * periodFactor;

      const filteredProducts = dummyDashboardData.produk_terlaris.filter((item) => {
        const matchCat = kategori === 'ALL' || item.kategori === kategori;
        const matchSeg = segmen === 'ALL' || item.segmen === segmen;
        return matchCat && matchSeg;
      });

      const base = dummyDashboardData.summary;
      return {
        status: 'success',
        data: {
          data_label: dummyDashboardData.data_label,
          summary: {
            ...base,
            omzet: Math.round(base.omzet * factor),
            hpp: Math.round(base.hpp * factor),
            laba_kotor: Math.round(base.laba_kotor * factor),
            laba_bersih: Math.round(base.laba_bersih * factor),
          },
          trend: dummyDashboardData.trend.map((t) => ({
            ...t,
            pendapatan: Math.round(t.pendapatan * factor),
            hpp: Math.round(t.hpp * factor),
            pengeluaran_op: Math.round(t.pengeluaran_op * factor),
          })),
          produk_terlaris:
            filteredProducts.length > 0 ? filteredProducts : dummyDashboardData.produk_terlaris,
        },
      };
    }
    throw error;
  }
}

export async function getStockAndDemandForecast(
  signal?: AbortSignal
): Promise<ApiResponse<StockForecast[]>> {
  try {
    const [demandRes, stockRes] = await Promise.all([
      apiClient.get<ApiResponse<StockForecast[]>>(API_ENDPOINTS.FORECAST_DEMAND, { signal }),
      apiClient.get<ApiResponse<StockForecast[]>>(API_ENDPOINTS.FORECAST_STOCK, { signal }),
    ]);
    return {
      status: 'success',
      data:
        stockRes.data?.data || demandRes.data?.data || dummyDashboardData.forecasts,
    };
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      return {
        status: 'success',
        data: dummyDashboardData.forecasts,
      };
    }
    throw error;
  }
}

export async function getWeeklyInsight(
  { simulateFallback = false }: { simulateFallback?: boolean } = {},
  signal?: AbortSignal
): Promise<ApiResponse<WeeklyInsight>> {
  try {
    if (simulateFallback) {
      const quotaErr = new Error(
        'Kuota API Gemini tercapai. Menampilkan ringkasan cadangan.'
      ) as ApiError;
      quotaErr.code = 'AI_QUOTA_EXCEEDED';
      quotaErr.status = 429;
      quotaErr.isNetworkError = false;
      throw quotaErr;
    }
    const response = await apiClient.post<ApiResponse<WeeklyInsight>>(
      API_ENDPOINTS.INSIGHTS_WEEKLY,
      undefined,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (
      isApiError(error) ||
      (error instanceof Error &&
        (error as ApiError).code === 'AI_QUOTA_EXCEEDED')
    ) {
      const apiErr = error as ApiError;
      if (
        apiErr.isNetworkError ||
        apiErr.code === 'AI_QUOTA_EXCEEDED' ||
        apiErr.code === 'AI_TIMEOUT'
      ) {
        if (
          simulateFallback ||
          apiErr.code === 'AI_QUOTA_EXCEEDED' ||
          apiErr.code === 'AI_TIMEOUT'
        ) {
          return {
            status: 'success',
            code: apiErr.code || 'AI_QUOTA_EXCEEDED',
            message:
              'Layanan AI sedang sibuk/kuota habis. Ringkasan otomatis tanpa AI ditampilkan.',
            data: dummyDashboardData.weekly_insight_fallback,
          };
        }
        return {
          status: 'success',
          data: dummyDashboardData.weekly_insight_ai,
        };
      }
    }
    throw error;
  }
}

interface RagAssistantResponse {
  intent: string;
  answer: string;
  sources: string[];
}

export async function askRagAssistant(
  { question, periode = 'Mei 2026' }: { question: string; periode?: string },
  signal?: AbortSignal
): Promise<ApiResponse<RagAssistantResponse>> {
  try {
    const response = await apiClient.post<ApiResponse<RagAssistantResponse>>(
      API_ENDPOINTS.CHAT_RAG,
      { question, periode },
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      await new Promise((r) => setTimeout(r, 600));
      const q = String(question || '').toLowerCase();

      if (q.includes('lilin') || q.includes('malam') || q.includes('stok') || q.includes('mori')) {
        return {
          status: 'success',
          data: {
            intent: 'stok',
            answer:
              'Stok Kain Mori Primissima saat ini 18 meter (di bawah batas aman 25 meter) dan disarankan beli 50 meter. Stok Lilin Malam Klowong 14,5 kg cukup aman untuk 20 kain seragam B2G yang membutuhkan sekitar 9 kg lilin malam, dengan cadangan aman tersisa 5,5 kg.',
            sources: ['Master Bahan (MAT-01, MAT-02)', 'Forecast Stok Mingguan'],
          },
        };
      }

      if (q.includes('hpp') || q.includes('modal') || q.includes('harga')) {
        return {
          status: 'success',
          data: {
            intent: 'hpp',
            answer:
              'HPP pokok Batik Tulis Motif Daun Mangga (2,5 m) saat ini Rp221.500 per lembar (Bahan 56%, Tenaga Kerja 34%, Overhead 10%). Dengan target margin 35%, harga jual saran adalah Rp340.769 per lembar.',
            sources: ['Resep HPP (RCP-01)', 'Harga Bahan Rata-rata Terbobot'],
          },
        };
      }

      if (q.includes('laba') || q.includes('omzet') || q.includes('laporan') || q.includes('untung')) {
        return {
          status: 'success',
          data: {
            intent: 'laporan',
            answer:
              'Rekap periode Mei 2026 menunjukkan Omzet Penjualan Rp48.750.000, Total HPP Rp28.320.000, Laba Kotor Rp20.430.000 (margin 41,9%), dan Laba Bersih Operasional Rp14.850.000.',
            sources: ['Dashboard Ringkasan Mei 2026'],
          },
        };
      }

      if (q.includes('nota') || q.includes('ocr') || q.includes('cara') || q.includes('pakai')) {
        return {
          status: 'success',
          data: {
            intent: 'aplikasi',
            answer:
              'Untuk mencatat nota belanja: buka menu Pengeluaran & OCR, ambil foto nota di tempat terang dan datar, lalu periksa kolom kuning apabila muncul penanda "Perlu Verifikasi" sebelum menekan tombol simpan.',
            sources: ['Panduan Operasional Aplikasi Azrya Batik'],
          },
        };
      }

      return {
        status: 'success',
        data: {
          intent: 'out_of_context',
          answer:
            'Maaf, asisten ini hanya menjawab pertanyaan terkait data keuangan, perhitungan HPP, stok bahan batik, dan panduan penggunaan aplikasi Azrya Batik.',
          sources: ['Batasan Konteks RAG Azrya Batik'],
        },
      };
    }
    throw error;
  }
}
