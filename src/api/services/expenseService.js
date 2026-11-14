import apiClient from '../apiClient';
import { dummyExpenses, dummyMaterials } from '../mockData';

const STORAGE_KEY_EXP = 'azrya_demo_expenses';
const STORAGE_KEY_MAT = 'azrya_demo_materials';

function getLocalExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXP);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length > 0) {
        const savedIds = new Set(saved.map((exp) => exp.id));
        const missingDefaults = dummyExpenses.filter((exp) => !savedIds.has(exp.id));
        return [...saved, ...missingDefaults];
      }
    }
  } catch {
    // Abaikan error parse
  }
  return dummyExpenses;
}

function getLocalMaterials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAT);
    if (raw) return JSON.parse(raw);
  } catch {
    // Abaikan error parse
  }
  return dummyMaterials;
}

export async function getMaterials() {
  try {
    const response = await apiClient.get('/materials');
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      return { status: 'success', data: getLocalMaterials() };
    }
    throw error;
  }
}

export async function getExpenses() {
  try {
    const response = await apiClient.get('/expenses');
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      return { status: 'success', data: getLocalExpenses() };
    }
    throw error;
  }
}

export async function scanReceiptOcr(file, simulationMode = 'low_confidence') {
  try {
    const formData = new FormData();
    if (file) {
      formData.append('image', file);
    }
    const response = await apiClient.post('/expenses/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      await new Promise((resolve) => setTimeout(resolve, 900));

      if (simulationMode === 'timeout') {
        const err = new Error(
          'Gagal membaca foto nota karena layanan OCR melebihi batas waktu (AI_TIMEOUT). Silakan foto ulang di tempat terang atau isi form pengeluaran secara manual.'
        );
        err.code = 'AI_TIMEOUT';
        throw err;
      }

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
            bukti_url: file ? URL.createObjectURL(file) : '/assets/corak_batikHitam.jpg',
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
          bukti_url: file ? URL.createObjectURL(file) : '/assets/corak_batikHitam.jpg',
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

export async function createExpense(payload) {
  try {
    const response = await apiClient.post('/expenses', payload);
    return response.data;
  } catch (error) {
    if (error.isNetworkError) {
      const existing = getLocalExpenses();
      const newExp = {
        id: `EXP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(existing.length + 42).padStart(3, '0')}`,
        ...payload,
      };
      localStorage.setItem(STORAGE_KEY_EXP, JSON.stringify([newExp, ...existing]));

      // Perbarui harga bahan master rata-rata bergerak terbobot sederhana
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
        localStorage.setItem(STORAGE_KEY_MAT, JSON.stringify(materials));
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
