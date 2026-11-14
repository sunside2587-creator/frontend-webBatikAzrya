import apiClient from '../apiClient';
import { dummyProducts, dummyTransactions } from '../mockData';

const STORAGE_KEY_TRX = 'azrya_demo_transactions';

function getLocalTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRX);
    if (raw) {
      const saved = JSON.parse(raw);
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

export async function getProducts() {
  try {
    const response = await apiClient.get('/products');
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      return { status: 'success', data: dummyProducts };
    }
    throw error;
  }
}

export async function getTransactions() {
  try {
    const response = await apiClient.get('/transactions');
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      return { status: 'success', data: getLocalTransactions() };
    }
    throw error;
  }
}

export async function createTransaction(payload) {
  try {
    const response = await apiClient.post('/transactions', payload);
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      const existing = getLocalTransactions();
      const hppTotal = payload.items.reduce(
        (sum, item) => sum + Number(item.hpp_snapshot || 0) * Number(item.qty || 0),
        0
      );
      const total = Number(payload.total || 0);
      const marginNominal = total - hppTotal;
      const marginPersen = total > 0 ? Number(((marginNominal / total) * 100).toFixed(1)) : 0;

      const newTrx = {
        id: `TRX-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(existing.length + 87).padStart(3, '0')}`,
        ...payload,
        hpp_total: hppTotal,
        margin_nominal: marginNominal,
        margin_persen: marginPersen,
      };
      const updated = [newTrx, ...existing];
      localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(updated));
      return {
        status: 'success',
        message: `Transaksi ${payload.pelanggan_tipe} tersimpan & stok produk berkurang.`,
        data: newTrx,
      };
    }
    throw error;
  }
}
