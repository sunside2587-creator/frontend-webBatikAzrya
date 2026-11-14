import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';
import type {
  ApiResponse,
  CreateTransactionPayload,
  Product,
  Transaction,
} from '../types';
import apiClient, { isApiError } from './apiClient';
import { dummyProducts, dummyTransactions } from './mockData';

function getLocalTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const saved = JSON.parse(raw) as Transaction[];
      if (Array.isArray(saved) && saved.length > 0) {
        const savedIds = new Set(saved.map((trx) => trx.id));
        const missingDefaults = dummyTransactions.filter((trx) => !savedIds.has(trx.id));
        return [...saved, ...missingDefaults];
      }
    }
  } catch {
    // Abaikan error parse storage
  }
  return dummyTransactions;
}

export async function getProducts(
  signal?: AbortSignal
): Promise<ApiResponse<Product[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Product[]>>(API_ENDPOINTS.PRODUCTS, {
      signal,
    });
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      return { status: 'success', data: dummyProducts };
    }
    throw error;
  }
}

export async function getTransactions(
  signal?: AbortSignal
): Promise<ApiResponse<Transaction[]>> {
  try {
    const response = await apiClient.get<ApiResponse<Transaction[]>>(
      API_ENDPOINTS.TRANSACTIONS,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      return { status: 'success', data: getLocalTransactions() };
    }
    throw error;
  }
}

export async function createTransaction(
  payload: CreateTransactionPayload,
  signal?: AbortSignal
): Promise<ApiResponse<Transaction>> {
  try {
    const response = await apiClient.post<ApiResponse<Transaction>>(
      API_ENDPOINTS.TRANSACTIONS,
      payload,
      { signal }
    );
    return response.data;
  } catch (error) {
    if (isApiError(error) && error.isNetworkError) {
      const existing = getLocalTransactions();
      const hppTotal = payload.items.reduce(
        (sum, item) => sum + Number(item.hpp_snapshot || 0) * Number(item.qty || 0),
        0
      );
      const total = Number(payload.total || 0);
      const marginNominal = total - hppTotal;
      const marginPersen =
        total > 0 ? Number(((marginNominal / total) * 100).toFixed(1)) : 0;

      const newTrx: Transaction = {
        id: `TRX-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(
          existing.length + 87
        ).padStart(3, '0')}`,
        ...payload,
        hpp_total: hppTotal,
        margin_nominal: marginNominal,
        margin_persen: marginPersen,
      };
      const updated = [newTrx, ...existing];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      return {
        status: 'success',
        message: `Transaksi ${payload.pelanggan_tipe} tersimpan & stok produk berkurang.`,
        data: newTrx,
      };
    }
    throw error;
  }
}
