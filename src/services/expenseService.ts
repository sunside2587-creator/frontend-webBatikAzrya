import { API_ENDPOINTS, BUSINESS_CONSTANTS, STORAGE_KEYS } from '../constants';
import type { ApiError, ApiResponse, Expense, ExpenseSource, Material } from '../types';
import apiClient, { isApiError } from './apiClient';
import { dummyExpenses, dummyMaterials } from './mockData';

export type OcrSimulationMode = 'low_confidence' | 'high_confidence' | 'timeout';

export interface OcrScanItemResponse {
  nama_item: string;
  material_id: string;
  qty: number;
  satuan: string;
  harga?: number;
  harga_per_satuan?: number;
  subtotal?: number;
  needs_correction: boolean;
}

export interface OcrScanResponseData {
  toko: string;
  tanggal: string;
  kategori: string;
  total: number;
  confidence: number;
  needs_verification: boolean;
  code: string | null;
  bukti_url: string;
  items: OcrScanItemResponse[];
}

export interface CreateExpensePayload {
  tanggal: string;
  toko: string;
  kategori: string;
  total: number;
  sumber: ExpenseSource;
  confidence: number;
  needs_verification: boolean;
  bukti_url: string;
  items: Expense['items'];
}

function getLocalExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (raw) {
      const saved = JSON.parse(raw) as Expense[];
      if (Array.isArray(saved) && saved.length > 0) {
        const savedIds = new Set(saved.map((exp) => exp.id));
        const missingDefaults = dummyExpenses.filter((exp) => !savedIds.has(exp.id));
        return [...saved, ...missingDefaults];
      }
    }
  } catch {
    // Abaikan error parse storage
  }
  return dummyExpenses;
}

function getLocalMaterials(): Material[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    if (raw) return JSON.parse(raw) as Material[];
  } catch {
    // Abaikan error parse storage
  }
  return dummyMaterials;
}

export async function getMaterials(
  signal?: AbortSignal
): Promise<ApiResponse<Material[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Material[]>>(
      API_ENDPOINTS.MATERIALS,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      return { status: 'success', data: getLocalMaterials() };
    }
    throw error;
  }
}

export async function getExpenses(
  signal?: AbortSignal
): Promise<ApiResponse<Expense[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Expense[]>>(
      API_ENDPOINTS.EXPENSES,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      return { status: 'success', data: getLocalExpenses() };
    }
    throw error;
  }
}

export async function scanReceiptOcr(
  file: File | null,
  simulationMode: OcrSimulationMode = 'low_confidence',
  signal?: AbortSignal
): Promise<ApiResponse<OcrScanResponseData>> {
  try {
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }
    const response = await apiClient.post<ApiResponse<OcrScanResponseData>>(
      API_ENDPOINTS.EXPENSES_SCAN,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: BUSINESS_CONSTANTS.OCR_TIMEOUT_MS,
        signal,
      }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      await new Promise((resolve) => setTimeout(resolve, 900));

      if (simulationMode === 'timeout') {
        const timeoutErr = new Error(
          'Gagal membaca foto nota karena layanan OCR melebihi batas waktu (AI_TIMEOUT). Silakan foto ulang di tempat terang atau isi form pengeluaran secara manual.'
        ) as ApiError;
        timeoutErr.code = 'AI_TIMEOUT';
        timeoutErr.status = 408;
        timeoutErr.isNetworkError = false;
        throw timeoutErr;
      }

      const buktiUrl = file ? URL.createObjectURL(file) : '/assets/corak_batikHitam.jpg';

      if (simulationMode === 'high_confidence') {
        return {
          status: 'success',
          message: 'Ekstraksi OCR berhasil dengan tingkat kepercayaan tinggi.',
          data: {
            toko: 'Toko Kimia & Bahan Batik Sumber Malam',
            tanggal: '2026-05-18',
            kategori: 'bahan',
            total: 780000,
            confidence: 0.94,
            needs_verification: false,
            code: null,
            bukti_url: buktiUrl,
            items: [
              {
                nama_item: 'Kain Mori Primissima',
                material_id: 'MAT-01',
                qty: 15,
                satuan: 'meter',
                harga: 36000,
                subtotal: 540000,
                needs_correction: false,
              },
              {
                nama_item: 'Lilin Malam Klowong Super',
                material_id: 'MAT-02',
                qty: 5,
                satuan: 'kg',
                harga: 48000,
                subtotal: 240000,
                needs_correction: false,
              },
            ],
          },
        };
      }

      return {
        status: 'success',
        code: 'OCR_LOW_CONFIDENCE',
        message:
          'Sebagian teks pada baris harga lilin malam terlipat. Mohon verifikasi dan sesuaikan angka sebelum konfirmasi simpan.',
        data: {
          toko: 'Toko Kimia & Bahan Batik Sumber Malam',
          tanggal: '2026-05-18',
          kategori: 'bahan',
          total: 780000,
          confidence: 0.74,
          needs_verification: true,
          code: 'OCR_LOW_CONFIDENCE',
          bukti_url: buktiUrl,
          items: [
            {
              nama_item: 'Kain Mori Primissima',
              material_id: 'MAT-01',
              qty: 15,
              satuan: 'meter',
              harga: 36000,
              subtotal: 540000,
              needs_correction: false,
            },
            {
              nama_item: 'Lilin Malam Klowong Super',
              material_id: 'MAT-02',
              qty: 5,
              satuan: 'kg',
              harga: 48000,
              subtotal: 240000,
              needs_correction: true,
            },
          ],
        },
      };
    }
    throw error;
  }
}

export async function createExpense(
  payload: CreateExpensePayload,
  signal?: AbortSignal
): Promise<ApiResponse<Expense>> {
  try {
    const response = await apiClient.post<ApiResponse<Expense>>(
      API_ENDPOINTS.EXPENSES,
      payload,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      const existing = getLocalExpenses();
      const newExp: Expense = {
        id: `EXP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(
          existing.length + 42
        ).padStart(3, '0')}`,
        ...payload,
      };
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([newExp, ...existing]));

      if (Array.isArray(payload.items) && payload.items.length > 0) {
        const materials = getLocalMaterials().map((mat) => {
          const matchedItem = payload.items.find((it) => it.material_id === mat.id);
          if (!matchedItem) return mat;
          const oldQty = Math.max(1, Number(mat.stok_saat_ini) || 1);
          const newQty = Math.max(0, Number(matchedItem.qty) || 0);
          const oldPrice = Number(mat.harga_per_satuan) || 0;
          const newPrice = Number(matchedItem.harga_per_satuan) || oldPrice;
          const weightedAvg = Math.round(
            (oldQty * oldPrice + newQty * newPrice) / (oldQty + newQty)
          );
          return {
            ...mat,
            stok_saat_ini: Number((mat.stok_saat_ini + newQty).toFixed(1)),
            harga_per_satuan: weightedAvg,
          };
        });
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
      }

      return {
        status: 'success',
        message: 'Pengeluaran dan harga rata-rata bahan baku HPP berhasil diperbarui.',
        data: newExp,
      };
    }
    throw error;
  }
}
